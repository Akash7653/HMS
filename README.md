# Advanced HMS (MERN + Tailwind)

Production-style Hotel Management System with real-time room availability, role-based dashboards, booking flow, analytics, and modern responsive UI.

## Structure

- `client/` React + Vite + Tailwind frontend
- `server/` Node + Express + MongoDB backend
- `server/src/models/` Mongoose schemas
- `server/src/routes/` REST API routes
- `server/src/controllers/` business logic
- `server/src/middleware/` auth, validation, upload, errors

## Quick Start

### 1) Backend setup

1. Open terminal in `server/`
2. Install packages: `npm install`
3. Copy `.env.example` to `.env`
4. Set `MONGO_URI`, `JWT_SECRET`, and optional Cloudinary/SMTP keys
5. Seed data: `npm run seed`
6. Start backend: `npm run dev`

### 2) Frontend setup

1. Open terminal in `client/`
2. Install packages: `npm install`
3. Copy `.env.example` to `.env`
4. Start frontend: `npm run dev`

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Demo Credentials

- Admin: `admin@hms.com` / `admin123`
- User: `user@hms.com` / `user123`

## Implemented Features

- JWT auth and RBAC
- Hotel listing, filters, sorting, pagination
- Hotel details with image gallery, amenities, reviews
- Real-time availability stream (SSE)
- Date-overlap validation to prevent double booking
- Dynamic pricing calculation (weekday/weekend)
- Booking create/history/cancel with payment simulation
- Wishlist/favorites
- Admin hotel CRUD, inventory updates, all bookings, analytics
- Toast notifications + email simulation
- Cloudinary image upload endpoint
- Framer Motion animations and skeleton loaders
- Responsive layout and dark mode
- Chart.js room popularity visualization

## API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/hotels`
- `GET /api/hotels/:id`
- `GET /api/bookings/availability`
- `GET /api/bookings/availability/stream`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/reviews`
- `POST /api/wishlist/toggle`
- `GET /api/admin/analytics`

## Notes

- Stripe and Razorpay are simulated by default via booking payment reference generation.
- To enable real email sending, set SMTP credentials in `server/.env`.
- To enable Cloudinary, set all Cloudinary env vars.
- SMS provider is configurable using `SMS_PROVIDER` (`textbelt`, `twilio`, or `hybrid`).
- For free-tier setup, use `SMS_PROVIDER=textbelt` and `TEXTBELT_KEY=textbelt` (limited quota).
- For automatic fallback, use `SMS_PROVIDER=hybrid` so Textbelt is tried first and Twilio is used if Textbelt quota is exhausted.
