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

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase
- **State Management**: Zustand (with persist middleware)
- **PWA Integration**: `next-pwa` package

---

## Architecture Decisions

### 1. Database-Centric Concurrency Control
To prevent double-bookings, the system bypasses simple client-side checks and handles concurrency directly at the database level.
* **`reserve_seat` RPC function**: All checkout requests trigger a PostgreSQL RPC transaction.
* **Pessimistic Row-Level Locking (`FOR UPDATE NOWAIT`)**: When a seat booking transaction starts, Postgres locks that seat row. If another transaction tries to lock the same row at the exact same millisecond, the lock fails instantly and throws an error rather than waiting or allowing a double-booking.

### 2. Database-level Policy Enforcement (Triggers)
To guarantee strict compliance with cancellation rules:
* A PostgreSQL Trigger (`check_cancellation_time`) monitors all `DELETE` or cancellation actions on bookings.
* If a cancellation request is issued within 2 hours of flight departure, the database throws an exception and rolls back the transaction. This guarantees that business rules are enforced regardless of whether the request comes from the UI or an external API client.

### 3. State Management with Secure Persistence (Zustand)
We selected Zustand for fast client-side state transitions. 
* **Selective Persistence**: By using the `partialize` middleware, we save the user's booking steps and flight search queries.
* **Security Isolation**: Sensitive passenger details (like **Passport Numbers**) are explicitly stripped from the persistence layer so they are never saved to unencrypted `localStorage`.

### 4. Build-Time Static Prerendering (Next.js Suspense)
To ensure the app builds and deploys successfully on Vercel:
* Next.js App Router statically builds pages by default. However, utilizing `useSearchParams()` bails out of static generation.
* We isolated search-parameter extraction inside client components (`LoginContent` & `SearchContent`) and wrapped them with `<Suspense>` boundaries. This permits the outer routes (`/login` and `/search`) to compile as static pages, drastically boosting performance and page-load times.

---

## Setup Instructions

### 1. Supabase Setup
1. Create a new project on Supabase.
2. Navigate to the SQL Editor.
3. Copy the contents of [00001_initial_schema.sql](file:///c:/Users/ritik/OneDrive/Desktop/vscodefiles/myproject/Vehicle_App/sA/supabase/migrations/00001_initial_schema.sql) and run it. This script creates the schema (flights, seats, bookings, passengers), sets up Row Level Security (RLS) policies, declares triggers, and seeds dummy data.

### 2. Supabase Auth Configuration (CRITICAL FOR TESTING)
By default, Supabase enforces email verification, which has a strict rate limit (3 signups per hour) on the default SMTP server.
To prevent the "Email rate limit exceeded" error during testing:
1. Go to your Supabase Dashboard -> **Authentication** -> **Providers**.
2. Click **Email**.
3. Toggle **Confirm email** to **OFF** (Disabled).
4. Click **Save**.
*This allows you to sign up and log in instantly with any dummy email without waiting for confirmation links.*

### 3. Environment Variables
Rename `.env.example` to `.env` (or `.env.local`) and fill in your Supabase details:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## Testing / Demo Guide

To test the application, use the following preset routes in the Search Form:

| Origin (From) | Destination (To) | Route Description |
|---|---|---|
| **JFK** | **LHR** | New York to London |
| **DXB** | **SIN** | Dubai to Singapore |
| **SFO** | **NRT** | San Francisco to Tokyo |
| **CDG** | **JFK** | Paris to New York |

### How to Test:
1. **Search**: Enter JFK and LHR in the search fields and click search. Select any of the returned flights.
2. **Realtime Seat Booking**: Open the search page in a private incognito window as well. When you book a seat in one window, you will see it turn occupied in the other window in real-time.
3. **Locking**: Attempt to click checkout on the same seat at the exact same moment. One will succeed, the other will show a locking reservation error!

---

## Architectural Trade-offs

1. **Supabase Realtime vs. Dedicated WebSocket Broker**:
   * *Trade-off*: We opted to use Supabase Realtime broadcast channels rather than building a custom Node.js/Socket.io service. This eliminates all custom server infrastructure, but couples seat synchronization to Supabase's pricing tier limits.
2. **Client-Side Supabase Client vs. Next.js Server Actions for Data Fetching**:
   * *Trade-off*: For real-time updates and lightning-fast optimistic feedback on seat maps, we fetch and update seat data on the client. While this provides a native app-like experience, it requires exposing RLS-guarded access directly through the anon key rather than completely hiding SQL calls behind a server layer.

---

## Incomplete Features & Future Roadmap

1. **Payment Gateway Integration**:
   * *Status*: Mocked. Clicking "Checkout" currently proceeds directly to a simulated successful booking. A production version would integrate Stripe or another PSP to authorize payments before calling the `reserve_seat` database RPC.
2. **Offline Writing & Synced Queues**:
   * *Status*: Partially Complete. Thanks to our Service Worker config (`next-pwa`), users can browse cached flights and seat maps offline. However, attempting to book or cancel a flight offline will fail. A future upgrade would queue offline mutations in IndexedDB and replay them once an internet connection is established.
3. **Identity Verification & Passport Check**:
   * *Status*: Incomplete. The passport number and nationality inputs are simple, unchecked text fields. A real-world application would connect to external customs or flight-security verification databases (such as APIS) to validate passport numbers.
4. **Flight Rescheduling Frontend**:
   * *Status*: Database Only. The database schema contains a robust table for `reschedules`, but the user interface currently only exposes bookings and cancellations.
