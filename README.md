# FXONS — Global Multi-Asset Broker Platform

Full-stack forex broker platform (FXONS) for global traders.

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Backend:** NestJS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + refresh tokens
- **Styling:** Tailwind CSS
- **AI KYC:** Google Cloud Vision API (free tier)
- **File Storage:** Cloudflare R2
- **Price Feed:** Twelve Data API
- **Trading:** OANDA REST API (or MT5 Bridge via MQL5-JSON-API)
- **Crypto Payments:** NOWPayments API
- **Email:** SendGrid

## Project Structure

```
.
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js public website + client portal + admin
├── packages/
│   └── database/         # Prisma schema + client
├── img/                  # Reference XM Global screenshots
└── .env.example
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL and update `DATABASE_URL` in `.env`.

4. Run database migrations:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start development servers:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Demo Credentials

- Admin: `admin@fxons.com` / `Admin123!`
- Client: `client@fxons.com` / `Client123!`

## Deployment

- **Frontend:** Vercel (connect `apps/frontend`)
- **Backend:** Railway or Hetzner Ubuntu VPS
- **Database:** Railway or same VPS

## Important Notes

- Place your `google-credentials.json` in `apps/backend/` for Google Vision.
- Configure Cloudflare R2 credentials for KYC image storage.
- Configure Twelve Data, OANDA, NOWPayments, and SendGrid credentials in `.env`.
