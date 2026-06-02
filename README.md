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
- OpenAI-compatible API client
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

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Configure `DATABASE_URL` and auth secrets in `.env`.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run migrations:

```bash
npm run prisma:migrate
```

6. Seed demo data:

```bash
npm run db:seed
```

7. Start development server:

```bash
npm run dev
```

## Environment Variables

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
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

## AI Provider Configuration

- Set `OPENAI_API_KEY`
- Optionally set `OPENAI_BASE_URL` for compatible providers
- Optionally set `OPENAI_MODEL` (default is `gpt-4o-mini`)

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add all required environment variables in Vercel project settings.
4. Provision PostgreSQL and set `DATABASE_URL`.
5. Run migrations in CI/CD or manually before first production boot.
6. Deploy.

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
