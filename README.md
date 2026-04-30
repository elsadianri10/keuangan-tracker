# Keuangan Web

A personal finance web app for tracking `hutang` (debt), `piutang` (receivables), and `tagihan` (bills) in one dashboard.

<!-- ![Keuangan Web Preview](./banner.png) -->

## Overview

`Keuangan Web` helps users record financial obligations and monitor payment progress with a simple admin-style interface.

Core focus:
- Manage debt and receivable records.
- Track bills and installment history.
- Keep data structured through API routes and a relational database.

## Main Features

- Authentication pages (sign in, sign up, forgot password).
- Debt (`hutang`) CRUD flow.
- Receivable (`piutang`) CRUD flow.
- Bills (`tagihan`) management.
- Installment tracking for bill items.
- Dashboard and supporting UI pages.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend/API:** Next.js Route Handlers (`src/app/api/**`)
- **Database:** MySQL + Prisma ORM
- **Tooling:** ESLint, Prettier

## Project Structure

```text
src/
  app/
    (admin)/...                 # protected/admin pages
    (full-width-pages)/...      # auth and full-width layouts
    api/                        # route handlers (hutang, piutang, tagihan, market)
  components/                   # reusable UI and feature components
database/
  mysql/                        # SQL init and seed files
prisma/
  schema.prisma                 # Prisma schema
```

## Getting Started

### 1) Prerequisites

- Node.js 20+ (recommended)
- npm
- MySQL 8+

### 2) Clone and install

```bash
git clone <your-repository-url>
cd keuangan-web
npm install
```

### 3) Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill required values:

```env
DATABASE_URL="mysql://root:password@localhost:3306/finance_tracker_db"
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"
```

### 4) Database setup

Generate Prisma client:

```bash
npm run db:generate
```

Push schema to database:

```bash
npm run db:push
```

Optional:
- Run migrations with `npm run db:migrate`
- Open Prisma Studio with `npm run db:studio`

If needed, you can also use SQL scripts in `database/mysql/` for manual init/seed.

### 5) Run development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to DB
- `npm run db:migrate` - Run Prisma migration (dev)
- `npm run db:studio` - Open Prisma Studio

## API Summary

Main API groups are under `src/app/api/`:

- `/api/hutang`
- `/api/piutang`
- `/api/tagihan`

Each group contains route handlers for list/create/update/delete flows based on the related module.

## Roadmap

- Payment due reminders/notifications
- Export report (PDF/Excel)
- Automated tests
- Deployment pipeline and monitoring

## License

This project is released under the MIT License. See `LICENSE` for details.
