-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.flights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flight_no VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    arrives_at TIMESTAMPTZ NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed')),
    base_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    class VARCHAR(20) NOT NULL CHECK (class IN ('economy', 'business', 'first')),
    is_available BOOLEAN DEFAULT true NOT NULL,
    extra_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flight_id, seat_number)
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled')),
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    total_price NUMERIC(10, 2) NOT NULL,
    pnr_code VARCHAR(10) NOT NULL UNIQUE,
    UNIQUE(flight_id, seat_id, status) -- Prevent double booking constraint (partially covered by seat availability)
);

CREATE TABLE IF NOT EXISTS public.passengers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    passport_no VARCHAR(50) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    dob DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reschedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    old_flight_id UUID NOT NULL REFERENCES public.flights(id),
    new_flight_id UUID NOT NULL REFERENCES public.flights(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    fee_charged NUMERIC(10, 2) DEFAULT 0.00 NOT NULL
);

-- ==============================================================================
-- 2. RLS POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedules ENABLE ROW LEVEL SECURITY;

-- Public read access for flights and seats
CREATE POLICY "Public profiles are viewable by everyone." ON public.flights FOR SELECT USING (true);
CREATE POLICY "Public seats are viewable by everyone." ON public.seats FOR SELECT USING (true);

-- Authenticated users can view and update their own bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own passenger details" ON public.passengers FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view their own reschedules" ON public.reschedules FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);

-- ==============================================================================
-- 3. DB-LEVEL VALIDATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION check_cancellation_time()
RETURNS TRIGGER AS $$
DECLARE
    v_departs_at TIMESTAMPTZ;
BEGIN
    -- Only act if the status is being changed to 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO v_departs_at FROM public.flights WHERE id = OLD.flight_id;
        
        IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
            RAISE EXCEPTION 'Cannot cancel a booking within 2 hours of flight departure.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_cancellation_time
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION check_cancellation_time();

-- ==============================================================================
-- 4. RPC FUNCTIONS FOR ATOMIC TRANSACTIONS
-- ==============================================================================

-- Function to reserve a seat atomically
CREATE OR REPLACE FUNCTION reserve_seat(
    p_flight_id UUID,
    p_seat_id UUID,
    p_total_price NUMERIC,
    p_pnr_code VARCHAR,
    p_full_name VARCHAR,
    p_passport_no VARCHAR,
    p_nationality VARCHAR,
    p_dob DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat_available BOOLEAN;
    v_booking_id UUID;
BEGIN
    -- 1. Lock the seat row to prevent concurrent updates
    SELECT is_available INTO v_seat_available
    FROM public.seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE NOWAIT; -- Fails immediately if another transaction holds the lock

    -- 2. Check if seat is actually available
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Seat not found.';
    END IF;

    IF NOT v_seat_available THEN
        RAISE EXCEPTION 'Seat is already booked.';
    END IF;

    -- 3. Mark seat as unavailable
    UPDATE public.seats
    SET is_available = false
    WHERE id = p_seat_id;

    -- 4. Create booking
    INSERT INTO public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
    VALUES (auth.uid(), p_flight_id, p_seat_id, p_total_price, p_pnr_code)
    RETURNING id INTO v_booking_id;

    -- 5. Insert passenger details
    INSERT INTO public.passengers (booking_id, full_name, passport_no, nationality, dob)
    VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

    -- Return success with the new booking ID
    RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);

EXCEPTION
    WHEN lock_not_available THEN
        RAISE EXCEPTION 'Seat is currently being booked by someone else.';
    WHEN OTHERS THEN
        RAISE; -- Re-raise the exception to be handled by PostgREST
END;
$$;

-- Function to cancel a booking atomically
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat_id UUID;
    v_flight_id UUID;
    v_user_id UUID;
BEGIN
    -- Lock booking row
    SELECT seat_id, flight_id, user_id INTO v_seat_id, v_flight_id, v_user_id
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE NOWAIT;

    -- Basic validation
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized to cancel this booking.';
    END IF;

    -- Update booking status (trigger will run here and fail if within 2 hours)
    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;

    -- Make seat available again
    UPDATE public.seats
    SET is_available = true
    WHERE id = v_seat_id;

    RETURN true;
END;
$$;

-- ==============================================================================
-- 5. SEED DATA & HELPER PROCEDURES
-- ==============================================================================

-- Procedure to generate seats for a flight
CREATE OR REPLACE FUNCTION generate_flight_seats(p_flight_id UUID)
RETURNS VOID AS $$
DECLARE
    r INT;
    c CHAR;
    seat_class VARCHAR;
    extra_fee NUMERIC;
BEGIN
    -- Generates 15 rows, 6 columns (A-F). Total 90 seats.
    -- Rows 1-3: First Class
    -- Rows 4-6: Business Class
    -- Rows 7-15: Economy Class
    FOR r IN 1..15 LOOP
        IF r <= 3 THEN
            seat_class := 'first';
            extra_fee := 500.00;
        ELSIF r <= 6 THEN
            seat_class := 'business';
            extra_fee := 200.00;
        ELSE
            seat_class := 'economy';
            extra_fee := 0.00;
        END IF;

        -- We only use A, B, C, D, E, F
        FOR c IN SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F']) LOOP
            INSERT INTO public.seats (flight_id, seat_number, class, extra_fee)
            VALUES (p_flight_id, r || c, seat_class, extra_fee);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


DO $$ 
DECLARE
    f1_id UUID; f2_id UUID; f3_id UUID; f4_id UUID;
    f5_id UUID; f6_id UUID; f7_id UUID; f8_id UUID;
BEGIN
    -- Clear existing data if re-running
    DELETE FROM public.flights;

    -- Insert 8 flights (4 routes)
    -- Route 1: JFK to LHR
    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('BA112', 'JFK', 'LHR', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 7 hours', 'Boeing 777', 450.00) RETURNING id INTO f1_id;
    
    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('VS004', 'JFK', 'LHR', NOW() + INTERVAL '3 days 10 hours', NOW() + INTERVAL '3 days 17 hours', 'Airbus A350', 480.00) RETURNING id INTO f2_id;

    -- Route 2: DXB to SIN
    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('EK404', 'DXB', 'SIN', NOW() + INTERVAL '5 days 2 hours', NOW() + INTERVAL '5 days 9 hours', 'Airbus A380', 600.00) RETURNING id INTO f3_id;

    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SQ495', 'DXB', 'SIN', NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days 7 hours', 'Boeing 787', 590.00) RETURNING id INTO f4_id;

    -- Route 3: SFO to NRT
    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('UA837', 'SFO', 'NRT', NOW() + INTERVAL '1 day 5 hours', NOW() + INTERVAL '1 day 16 hours', 'Boeing 777', 850.00) RETURNING id INTO f5_id;

    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('JL001', 'SFO', 'NRT', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 11 hours', 'Airbus A350', 880.00) RETURNING id INTO f6_id;

    -- Route 4: CDG to JFK
    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('AF022', 'CDG', 'JFK', NOW() + INTERVAL '15 hours', NOW() + INTERVAL '23 hours', 'Boeing 777', 550.00) RETURNING id INTO f7_id;

    INSERT INTO public.flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('DL263', 'CDG', 'JFK', NOW() + INTERVAL '4 days 8 hours', NOW() + INTERVAL '4 days 16 hours', 'Airbus A330', 520.00) RETURNING id INTO f8_id;

    -- Generate seats for all flights
    PERFORM generate_flight_seats(f1_id);
    PERFORM generate_flight_seats(f2_id);
    PERFORM generate_flight_seats(f3_id);
    PERFORM generate_flight_seats(f4_id);
    PERFORM generate_flight_seats(f5_id);
    PERFORM generate_flight_seats(f6_id);
    PERFORM generate_flight_seats(f7_id);
    PERFORM generate_flight_seats(f8_id);

    -- Let's randomly mark a few seats as unavailable to simulate existing bookings
    UPDATE public.seats
    SET is_available = false
    WHERE random() < 0.2 AND flight_id IN (f1_id, f2_id, f3_id, f4_id, f5_id, f6_id, f7_id, f8_id);

END $$;
