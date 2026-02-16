# Meeting Room Booking

A lightweight meeting room booking app — no login required. Organize rooms by organization, book with a tap, and get
notifications via Telegram or Discord bots.

## Features

- **No-login booking** — just type your name and pick a time slot
- **Organization-based** — group rooms under organizations with unique tags
- **Visual time grid** — tap or drag to select time ranges with 30-min slots
- **Real-time status** — see which rooms are available or occupied
- **Cancel with verification** — type booker name to confirm cancellation
- **Admin mode** — secret-protected admin access to create/delete orgs and rooms
- **Dark mode** — system-aware with manual toggle
- **Multi-language** — English and Vietnamese with localStorage persistence
- **Telegram bot** — link a group to an org with `/link <tag>` for booking notifications
- **Discord bot** — link a channel to an org with `/link <tag>` for booking notifications

## Tech Stack

- **Next.js 16** (App Router, React 18)
- **TypeScript**
- **Tailwind CSS** + custom UI components
- **Prisma** + PostgreSQL
- **Telegram Bot API** + **Discord Bot API**

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy env and configure
cp .env.example .env

# Start database (Docker)
docker compose up -d db

# Push schema & generate client
npm run db:push
npm run generate

# Optionally seed data
npm run db:seed

# Start dev server
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable                | Description                                 |
|-------------------------|---------------------------------------------|
| `DATABASE_URL`          | PostgreSQL connection string                |
| `ADMIN_SECRET`          | Secret for admin access                     |
| `TELEGRAM_BOT_TOKEN`    | Telegram bot token from BotFather           |
| `TELEGRAM_BOT_USERNAME` | Bot username (without @)                    |
| `DISCORD_BOT_TOKEN`     | Discord bot token                           |
| `DISCORD_APP_ID`        | Discord application ID                      |
| `DISCORD_PUBLIC_KEY`    | Discord public key for webhook verification |
| `NEXT_PUBLIC_APP_URL`   | Public URL of the app                       |

## Bot Setup

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in `.env`
3. Register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram/webhook"
```

4. Add the bot to a group and type `/link <org-tag>` to receive booking notifications

### Discord

1. Create an application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Set `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`, and `DISCORD_PUBLIC_KEY` in `.env`
3. Register slash commands:

```bash
npm run discord:register
```

4. Invite the bot to a server and use `/link <org-tag>` in a channel

## Scripts

| Command                    | Description                     |
|----------------------------|---------------------------------|
| `npm run dev`              | Start development server        |
| `npm run build`            | Production build                |
| `npm run start`            | Start production server         |
| `npm run db:push`          | Push Prisma schema to database  |
| `npm run db:migrate`       | Run Prisma migrations           |
| `npm run db:seed`          | Seed sample data                |
| `npm run db:studio`        | Open Prisma Studio              |
| `npm run discord:register` | Register Discord slash commands |

## Docker

```bash
# Full stack (app + database)
docker compose up -d

# Database only
docker compose up -d db
```

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (bookings, orgs, rooms, admin, bots)
│   ├── orgs/[id]/    # Organization detail page
│   ├── rooms/[id]/   # Room booking page
│   ├── page.tsx      # Home page
│   └── providers.tsx # Theme, i18n, admin context providers
├── components/
│   ├── admin/        # Admin modal, create org/room forms
│   ├── booking/      # Booking form, date picker, time grid, confirmation
│   ├── discord/      # Discord guide modal
│   ├── org/          # Organization card
│   ├── room/         # Room card, room schedule
│   ├── telegram/     # Telegram guide modal
│   └── ui/           # Button, modal, theme toggle, language switcher
├── lib/
│   ├── i18n/         # Translation dictionaries (en, vi) and context
│   ├── admin-context.tsx
│   ├── api.ts
│   ├── prisma.ts
│   ├── theme-context.tsx
│   ├── types.ts
│   ├── utils.ts
│   └── validations.ts
└── prisma/
    └── schema.prisma
```