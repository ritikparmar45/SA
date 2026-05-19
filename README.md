# AeroFlow - Flight Management PWA

A complete, production-grade Flight Management Web Application built with modern technologies. 

## Features
- 🛫 **Flight Search**: Blazing fast search optimized with modern UI.
- 💺 **Interactive Seat Map**: Realtime seat selection using Supabase Realtime.
- 🔐 **Authentication**: Secure login/signup via Supabase Auth.
- 💳 **Booking Checkout**: Complete checkout flow with pessimistic locking to prevent double-booking.
- 📅 **My Bookings**: Manage your bookings with DB-validated cancellation policies.
- 📱 **PWA Support**: Installable on mobile and desktop, works offline.
- 🌓 **Dark Mode**: Sleek modern SaaS aesthetic.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase
- **State Management**: Zustand (with persist middleware)
- **PWA Integration**: next-pwa package

## Architecture & Concurrency Control

### Realtime Seat Updates
The application uses Supabase Realtime to broadcast seat availability updates instantly to all connected clients. When a user selects a seat, they see an optimistic update.

### Preventing Double Booking
The database utilizes a PostgreSQL RPC function "reserve_seat" which encapsulates the booking process in a transaction. It uses FOR UPDATE NOWAIT row-level locking on the "seats" table. If two users attempt to book the exact same seat at the exact same millisecond, the database lock ensures one transaction proceeds while the other fails immediately, throwing a user-friendly error.

### Database-level Validation
Cancellations are guarded by a PostgreSQL Trigger "check_cancellation_time()". If a user attempts to cancel a booking within 2 hours of flight departure, the trigger rejects the update at the DB level, ensuring strict business logic enforcement that cannot be bypassed via the client.

## Setup Instructions

### 1. Supabase Setup
1. Create a new project on Supabase.
2. Navigate to the SQL Editor.
3. Copy the contents of supabase/migrations/00001_initial_schema.sql and run it. This script will:
   - Create tables (flights, seats, bookings, passengers, reschedules).
   - Enable Row Level Security (RLS) and define policies.
   - Create triggers for validation.
   - Create the reserve_seat and cancel_booking RPC functions.
   - Seed the database with sample flights and seat data.

### 2. Supabase Auth Configuration (CRITICAL FOR TESTING)
By default, Supabase enforces email verification, which has a strict rate limit (3 signups per hour) on the default SMTP server.
To prevent the Email rate limit exceeded error during testing:
1. Go to your Supabase Dashboard -> Authentication -> Providers.
2. Click Email.
3. Toggle Confirm email to OFF (Disabled).
4. Click Save.
*This allows you to sign up and log in instantly with any dummy email without waiting for confirmation links.*

### 3. Environment Variables
Rename .env.example to .env.local (or .env) and fill in your Supabase details:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Install Dependencies & Run
```
npm install
npm run dev
```
Navigate to localhost:3000 (or whichever port Next.js automatically opens, like localhost:3001).

---

## Testing / Demo Guide

To test the application, use the following preset routes in the Search Form (dates do not need to match exactly as date filtering is relaxed for demo convenience):

| Origin (From) | Destination (To) | Route Description |
|---|---|---|
| **JFK** | **LHR** | New York to London |
| **DXB** | **SIN** | Dubai to Singapore |
| **SFO** | **NRT** | San Francisco to Tokyo |
| **CDG** | **JFK** | Paris to New York |

### How to Test:
1. **Search**: Enter JFK and LHR in the search fields and search. Select any of the returned flights.
2. **Realtime Seat Booking**: Open the search page in a private incognito window as well. When you book a seat in one window, you will see it turn occupied in the other window in real-time.
3. **Locking**: Attempt to click checkout on the same seat at the exact same moment. One will succeed, the other will show a locking reservation error!
