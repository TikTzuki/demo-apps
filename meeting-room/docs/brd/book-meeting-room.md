# BRD: Book Meeting Room

## 1. Overview

A simple, anonymous meeting room booking application. Users can browse organizations, select a meeting room, enter their
name, choose a duration, and submit a booking — no login or account required.

Admins can create organizations and rooms by providing a shared secret. The secret is stored in the client's
localStorage and sent with admin requests.

## 2. Goals

- Allow anyone to quickly book a meeting room without authentication
- Provide a clear view of room availability across multiple organizations
- Keep the booking flow as frictionless as possible (3 steps or fewer)
- Allow admins to manage orgs and rooms via a simple secret-based mechanism

## 3. Core Concepts

### 3.1 Organization (Org)

- The top-level entity that owns meeting rooms
- Has a name and optional description
- Contains one or more meeting rooms

### 3.2 Meeting Room

- Belongs to exactly one organization
- Has a name, capacity (optional), and location/floor (optional)
- Tracks current and upcoming bookings

### 3.3 Booking

- Created anonymously — no user account required
- Fields:
    - **Booker name** — free-text input (required)
    - **Room** — selected from available rooms
    - **Start time** — defaults to "now" or user-selected
    - **Duration** — picked from predefined options (e.g. 15 min, 30 min, 1 hr, 2 hr)
- A booking is immutable once submitted (v1 — no edit/cancel)

### 3.4 Admin Secret

- A single shared secret stored as an environment variable on the server
- Client stores the secret in `localStorage` after first entry
- Sent via `X-Admin-Secret` header on admin API calls
- Grants access to create/delete orgs and rooms

## 4. Functional Requirements

### 4.1 Browse Organizations

| ID    | Requirement                                       |
|-------|---------------------------------------------------|
| FR-01 | System displays a list of all organizations       |
| FR-02 | User can select an organization to view its rooms |

### 4.2 View Meeting Rooms

| ID    | Requirement                                                                             |
|-------|-----------------------------------------------------------------------------------------|
| FR-03 | System displays all rooms for the selected organization                                 |
| FR-04 | Each room shows its current status: **Available** or **Occupied** (with remaining time) |
| FR-05 | Room list shows basic info: name, capacity, location                                    |

### 4.3 Book a Room

| ID    | Requirement                                                                  |
|-------|------------------------------------------------------------------------------|
| FR-06 | User selects a room                                                          |
| FR-07 | User enters their name as plain text (required, 1-100 chars)                 |
| FR-08 | User picks a duration from predefined options                                |
| FR-09 | User submits the booking                                                     |
| FR-10 | System validates there are no time conflicts before confirming               |
| FR-11 | System shows a confirmation with booking details after successful submission |

### 4.4 View Room Schedule

| ID    | Requirement                                       |
|-------|---------------------------------------------------|
| FR-12 | User can view today's schedule for any room       |
| FR-13 | Schedule shows booked time slots with booker name |

### 4.5 Admin: Manage Organizations

| ID    | Requirement                                                                           |
|-------|---------------------------------------------------------------------------------------|
| FR-14 | Admin can create a new organization by providing name + secret                        |
| FR-15 | Admin can delete an organization (and all its rooms/bookings)                         |
| FR-16 | System validates the secret against server-side env var before allowing admin actions |
| FR-17 | Client stores the secret in localStorage after first successful admin action          |
| FR-18 | If secret is already in localStorage, it is sent automatically on admin requests      |

### 4.6 Admin: Manage Rooms

| ID    | Requirement                                        |
|-------|----------------------------------------------------|
| FR-19 | Admin can create a new room within an organization |
| FR-20 | Admin can delete a room (and all its bookings)     |

## 5. Non-Functional Requirements

| ID     | Requirement                                                                    |
|--------|--------------------------------------------------------------------------------|
| NFR-01 | No authentication required for booking — fully anonymous                       |
| NFR-02 | Mobile-first responsive design                                                 |
| NFR-03 | Booking submission responds within 500ms                                       |
| NFR-04 | Data persisted in PostgreSQL                                                   |
| NFR-05 | Real-time or near-real-time room status updates                                |
| NFR-06 | Admin secret compared using constant-time comparison to prevent timing attacks |

## 6. Tech Stack

- **Framework**: Next.js 15 (App Router) — handles both frontend and API routes
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma
- **Admin auth**: Shared secret via `ADMIN_SECRET` env var

## 7. Data Model (PostgreSQL)

### organizations

| Column      | Type         | Constraints                    |
|-------------|--------------|--------------------------------|
| id          | UUID         | PK, default uuid_generate_v4() |
| name        | VARCHAR(200) | NOT NULL                       |
| description | TEXT         | NULLABLE                       |
| created_at  | TIMESTAMPTZ  | NOT NULL, default now()        |

### meeting_rooms

| Column     | Type         | Constraints                               |
|------------|--------------|-------------------------------------------|
| id         | UUID         | PK, default uuid_generate_v4()            |
| org_id     | UUID         | FK -> organizations.id, ON DELETE CASCADE |
| name       | VARCHAR(200) | NOT NULL                                  |
| capacity   | INTEGER      | NULLABLE                                  |
| location   | VARCHAR(200) | NULLABLE                                  |
| created_at | TIMESTAMPTZ  | NOT NULL, default now()                   |

### bookings

| Column      | Type         | Constraints                               |
|-------------|--------------|-------------------------------------------|
| id          | UUID         | PK, default uuid_generate_v4()            |
| room_id     | UUID         | FK -> meeting_rooms.id, ON DELETE CASCADE |
| booker_name | VARCHAR(100) | NOT NULL                                  |
| start_time  | TIMESTAMPTZ  | NOT NULL                                  |
| duration    | INTEGER      | NOT NULL (minutes)                        |
| end_time    | TIMESTAMPTZ  | NOT NULL (computed)                       |
| created_at  | TIMESTAMPTZ  | NOT NULL, default now()                   |

**Index**: `bookings(room_id, start_time, end_time)` for conflict queries.

## 8. API Endpoints (Next.js Route Handlers)

### Public

| Method | Path                           | Description                       |
|--------|--------------------------------|-----------------------------------|
| GET    | /api/orgs                      | List all organizations            |
| GET    | /api/orgs/[id]/rooms           | List rooms for an org             |
| GET    | /api/rooms/[id]/bookings?date= | Get bookings for a room on a date |
| POST   | /api/bookings                  | Create a booking                  |

### Admin (requires `X-Admin-Secret` header)

| Method | Path                       | Description            |
|--------|----------------------------|------------------------|
| POST   | /api/admin/orgs            | Create an organization |
| DELETE | /api/admin/orgs/[id]       | Delete an organization |
| POST   | /api/admin/orgs/[id]/rooms | Create a room          |
| DELETE | /api/admin/rooms/[id]      | Delete a room          |

## 8.1 Project Structure

```
meeting-room/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home — Org list
│   │   ├── orgs/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Org detail — Room list
│   │   ├── rooms/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Book a room
│   │   └── api/
│   │       ├── orgs/
│   │       │   ├── route.ts              # GET orgs
│   │       │   └── [id]/
│   │       │       └── rooms/
│   │       │           └── route.ts      # GET rooms for org
│   │       ├── rooms/
│   │       │   └── [id]/
│   │       │       └── bookings/
│   │       │           └── route.ts      # GET bookings for room
│   │       ├── bookings/
│   │       │   └── route.ts              # POST booking
│   │       └── admin/
│   │           ├── orgs/
│   │           │   ├── route.ts          # POST create org
│   │           │   └── [id]/
│   │           │       ├── route.ts      # DELETE org
│   │           │       └── rooms/
│   │           │           └── route.ts  # POST create room
│   │           └── rooms/
│   │               └── [id]/
│   │                   └── route.ts      # DELETE room
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── org/                # Org-related components
│   │   ├── room/               # Room-related components
│   │   ├── booking/            # Booking-related components
│   │   └── admin/              # Admin modal & forms
│   └── lib/
│       ├── prisma.ts           # Prisma client singleton
│       ├── admin.ts            # Admin secret validation
│       └── types.ts            # Shared types
├── docker-compose.yml
├── .env                        # ADMIN_SECRET, DATABASE_URL
└── package.json
```

## 9. Admin Secret Flow

```
1. User clicks "Admin" button in the UI
2. If no secret in localStorage → prompt for secret input
3. Client sends request with X-Admin-Secret header
4. Server compares against ADMIN_SECRET env var (constant-time)
5. If valid → perform action, client saves secret to localStorage
6. If invalid → return 403, client clears stored secret
```

## 10. User Flow

### Booking Flow

```
[Select Org] → [Select Room] → [Enter Name + Pick Duration] → [Submit] → [Confirmation]
```

### Admin Flow

```
[Click Admin] → [Enter Secret (if needed)] → [Create/Delete Org or Room]
```

## 11. Duration Options (v1)

- 15 minutes
- 30 minutes
- 45 minutes
- 1 hour
- 1.5 hours
- 2 hours

## 12. Out of Scope (v1)

- User accounts / login (beyond admin secret)
- Edit or cancel bookings
- Recurring bookings
- Notifications / reminders
- Calendar integrations
- Multi-day bookings

## 13. Future Considerations (v2+)

- Cancel/edit bookings (with a simple passcode set at booking time)
- Recurring bookings
- Room amenities (projector, whiteboard, video conferencing)
- Floor map / visual room layout
- Push notifications for upcoming bookings
- Calendar export (iCal)

## 14. Wireframes

See `docs/brd/wireframes.html` — open in a browser to view all screens.