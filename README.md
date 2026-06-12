# StarCitizenOps

StarCitizenOps is a social operations-planning platform for Star Citizen organizations. It helps orgs coordinate joint fleet, ground, air, logistics, medical, and reconnaissance operations through shared planning tools, coalition management, member role assignments, and AI-generated operation briefs.

## Core Features

- Organization profiles and member management
- Alliance and coalition coordination
- Operation creation and scheduling
- Fleet, ground, air, and logistics asset planning
- Member role assignments
- RSVP and participation tracking
- AI-generated operation briefs
- Comments, notifications, and after-action reports
- Dark tactical dashboard interface

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL
- Auth.js / NextAuth credentials auth
- Zod validation
- Multi-provider AI (Gemini, Groq, OpenRouter, OpenAI)
- Vercel-ready deployment

## MVP Status

The current MVP supports the core loop:

1. Register/login
2. Edit profile
3. Create organization
4. Create operation
5. Add assets and participants
6. Generate AI operation plan
7. View operation detail page
8. RSVP and comment
9. Track updates on dashboard

## Routes

- /
- /login
- /register
- /dashboard
- /profile
- /profile/edit
- /organizations
- /organizations/new
- /organizations/[id]
- /organizations/[id]/edit
- /operations
- /operations/new
- /operations/[id]
- /operations/[id]/edit
- /ai-planner
- /notifications
- /settings
- /coalitions
- /coalitions/new
- /coalitions/[id]
- /social

## Local Setup

1. Install dependencies:

```bash
npm install
```

1. Copy environment file:

```bash
cp .env.example .env
```

1. Configure `DATABASE_URL` and auth secrets in `.env`.

1. Start local PostgreSQL with Docker Compose:

```bash
docker compose up -d postgres
```

Default local database connection:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/starcitizenops?schema=public"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/starcitizenops?schema=public"
```

Neon production connection setup:

```bash
# Runtime app traffic (pooled connection string from Neon)
DATABASE_URL="postgresql://<user>:<password>@<pooled-host>.neon.tech/<db>?sslmode=require"

# Prisma migrations (direct, non-pooled Neon host)
DIRECT_DATABASE_URL="postgresql://<user>:<password>@<direct-host>.neon.tech/<db>?sslmode=require"
```

1. Generate Prisma client:

```bash
npm run prisma:generate
```

1. Run migrations:

```bash
npm run prisma:migrate
```

1. Seed demo data:

```bash
npm run db:seed
```

1. Start development server:

```bash
npm run dev
```

## Environment Variables

- DATABASE_URL
- DIRECT_DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- AI_PROVIDER
- GEMINI_API_KEY
- GEMINI_MODEL (optional)
- GROQ_API_KEY
- GROQ_MODEL (optional)
- OPENROUTER_API_KEY
- OPENROUTER_MODEL (optional)
- OPENAI_API_KEY
- OPENAI_BASE_URL (optional)
- OPENAI_MODEL (optional)

## Prisma Commands

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run db:seed`

## Authentication

- Credentials-based login/register with hashed passwords
- Session handling via NextAuth
- Middleware-protected routes for dashboard, profile, organizations, operations, AI planner, notifications, settings, and coalitions

## Free AI Provider Setup

StarCitizenOps supports multiple AI providers from the backend API route. The frontend never receives API keys.

### Supported Providers

- **Gemini**: Has a free tier via Google AI Studio.
- **Groq**: Has a free tier with rate limits.
- **OpenRouter**: Offers free model options that can change over time.
- **OpenAI**: Typically requires billing credits or paid API usage.

### Optional No-Key Gemini Fallback (Browser)

If server-side keys are not configured, the AI planner can fall back to Puter Gemini in the browser:

`<script src="https://js.puter.com/v2/"></script>`

Notes:

- Primary flow is still server-side (`/api/ai-planner`).
- Fallback is used only when the server returns provider-not-configured.
- This fallback does not require storing your own Gemini API key in `.env`.

### Configure `.env`

Set your provider and key in `.env`:

```bash
AI_PROVIDER=gemini

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
```

Provider behavior:

- If `AI_PROVIDER` is set, that provider is used.
- If `AI_PROVIDER` is empty, the server auto-selects in this order:
  1. Gemini (if `GEMINI_API_KEY` exists)
  2. Groq (if `GROQ_API_KEY` exists)
  3. OpenRouter (if `OPENROUTER_API_KEY` exists)
  4. OpenAI (if `OPENAI_API_KEY` exists)

### Security Rules

- Put API keys only in `.env` (local) or deployment environment variables.
- Never expose API keys in frontend code.
- Never commit `.env` to GitHub.
- The AI request flow is:
  `AIPlannerPanel -> POST /api/ai-planner -> server-only provider wrapper -> selected AI provider`

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add all required environment variables in Vercel project settings.
4. Provision Neon PostgreSQL and set both `DATABASE_URL` (pooled) and `DIRECT_DATABASE_URL` (direct).
5. Run migrations in CI/CD or manually before first production boot with `npx prisma migrate deploy`.
6. Deploy.

## Live Weekly Auto-Refresh

When deployed, StarCitizenOps can auto-refresh mission data weekly via Vercel cron.

Configured cron routes:

- `/api/cron/mission-intelligence` (daily at 03:00 UTC)
- `/api/cron/weekly-live-refresh` (weekly on Monday at 04:00 UTC)
- `/api/cron/weekly-mission-seed-sync` (weekly on Monday at 04:30 UTC)

Required environment variables in production:

- `CRON_SECRET` (must match Vercel cron Authorization bearer secret)
- `MISSION_INTELLIGENCE_ENABLED=true`
- `WEEKLY_DATA_REFRESH_ENABLED=true`
- `WEEKLY_MISSION_SEED_SYNC_ENABLED=true` (enable only when you want automatic full mission seed resets)

What the weekly route does:

1. Runs mission intelligence ingestion (when enabled) to process new RSI source updates.
2. Returns mission-library health summary (template count + latest mission intelligence run status).

Notes:

- Ship catalog updates are code-based and ship with app deployments.
- Mission seed-library resets remain available via the existing maintenance script:
  `npx tsx scripts/sync-real-sc-missions.ts`
- The `/api/cron/weekly-mission-seed-sync` route performs the same full seed reset via cron when enabled.

You can trigger it manually for verification:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/weekly-live-refresh
```

## MVP Roadmap (Completed in this Stage)

- Base full-stack scaffold with tactical dark UI
- Prisma schema for operations ecosystem
- Auth flow and protected routes
- Core profile/org/operation creation flow
- Asset + participant + RSVP + comment loop
- AI planner generation + persistence
- Dashboard + notifications + coalition basics

## Future Roadmap (TODO)

- Deeper alliance workflows and federation controls
- Advanced role-based permissions and policy editor
- Public org/operation discovery
- Real-time live chat and command voice integrations
- Calendar integrations and timeline syncing
- Discord integration for announcements and signups
- In-app map overlays and tactical route tools
- Rich after-action analytics and replay views

## Seeded Test Users

Running the seed script provisions mock accounts with password `password123`:

- commander@starcitizenops.local (Aegis Command, org commander/owner)
- pilot@starcitizenops.local
- medic@starcitizenops.local
- recon@starcitizenops.local
- logistics@starcitizenops.local
- marine@starcitizenops.local

The seed also creates:

- A full primary org (Aegis Vanguard) with multi-role members
- A partner org (Atlas Freight Group)
- Coalition and alliance links
- A live social conversation with sample messages and reactions
- Follow relationships for social testing
