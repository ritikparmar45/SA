export type Flight = {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled' | 'delayed'
  base_price: number
}

export type Seat = {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

export type Booking = {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: 'confirmed' | 'cancelled' | 'rescheduled'
  booked_at: string
  total_price: number
  pnr_code: string
}

export type Passenger = {
  id: string
  booking_id: string
  full_name: string
  passport_no: string
  nationality: string
  dob: string
}

export type Reschedule = {
  id: string
  booking_id: string
  old_flight_id: string
  new_flight_id: string
  requested_at: string
  fee_charged: number
}
