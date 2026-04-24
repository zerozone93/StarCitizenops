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

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) |
| Validation | Zod |
| AI | OpenAI-compatible API |
| Deployment | Vercel |

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g. Neon, Supabase)
- OpenAI API key (or compatible provider)

### 1. Clone the repository

```bash
git clone https://github.com/zerozone93/StarCitizenops.git
cd StarCitizenops
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) section).

### 4. Set up the database

Push the Prisma schema to your database:

```bash
npm run db:push
```

Or run migrations (recommended for production):

```bash
npm run db:migrate
```

### 5. Seed demo data

```bash
npm run db:seed
```

This creates demo users, organizations, ships, vehicles, and operations.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To use a different port, set the `PORT` variable before running:

```bash
PORT=4000 npm run dev
```

Or update `PORT` in your `.env` file and change `NEXTAUTH_URL` to match (e.g. `http://localhost:4000`).

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/starcitizenops"

# Auth.js / NextAuth
AUTH_SECRET="your-random-secret-min-32-chars"   # generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"             # your app URL

# OpenAI / AI provider
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"     # or custom endpoint
OPENAI_MODEL="gpt-4o-mini"                      # or gpt-4o, gpt-3.5-turbo, etc.

# Server port (default: 3000)
PORT=3000
```

### Generating AUTH_SECRET

```bash
openssl rand -base64 32
```

## Prisma Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to DB (dev) |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:seed` | Seed the database with demo data |
| `npm run db:studio` | Open Prisma Studio |

## AI Provider Configuration

StarCitizenOps uses an OpenAI-compatible API for the AI Operation Planner.

### OpenAI (default)

```env
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
```

### Custom / Self-hosted (e.g. Ollama, LM Studio)

```env
OPENAI_API_KEY="ollama"                          # any non-empty string
OPENAI_BASE_URL="http://localhost:11434/v1"      # your local endpoint
OPENAI_MODEL="llama3.2"                          # your model name
```

## Deployment to Vercel

### 1. Import repository

Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository.

### 2. Configure environment variables

In Vercel's project settings, add all variables from `.env.example`:
- `DATABASE_URL` — use a hosted Postgres (Vercel Postgres, Neon, Supabase, Railway, etc.)
- `AUTH_SECRET` — generate a secure random string
- `NEXTAUTH_URL` — your production URL (e.g. `https://yourapp.vercel.app`)
- `OPENAI_API_KEY` — your OpenAI API key
- `OPENAI_BASE_URL` — OpenAI endpoint
- `OPENAI_MODEL` — model to use

### 3. Run database migrations

After first deployment, run migrations against your production database:

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### 4. Deploy

Vercel auto-deploys on every push to the main branch.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── profile/      # User profile
│   │   ├── organizations/
│   │   ├── operations/
│   │   ├── coalitions/
│   │   ├── ai-planner/
│   │   └── notifications/
│   ├── api/              # API routes
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── ai/               # AI planner components
│   ├── assets/           # Asset list components
│   ├── auth/             # Auth / permission components
│   ├── coalitions/       # Coalition components
│   ├── comments/         # Comment thread
│   ├── layout/           # AppShell, Sidebar, TopNav
│   ├── notifications/    # Notification list
│   ├── operations/       # Operation cards, RSVP, timeline
│   ├── organizations/    # Organization cards
│   └── ui/               # shadcn/ui + custom UI components
├── lib/
│   ├── ai.ts             # OpenAI client + system prompt
│   ├── auth-utils.ts     # Auth helpers
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── auth.ts               # NextAuth configuration
└── middleware.ts         # Route protection middleware
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Demo data seed script
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Main dashboard |
| `/profile` | User profile |
| `/profile/edit` | Edit profile |
| `/organizations` | Browse organizations |
| `/organizations/new` | Create organization |
| `/organizations/[id]` | Organization detail |
| `/organizations/[id]/edit` | Edit organization |
| `/operations` | Browse operations |
| `/operations/new` | Create operation |
| `/operations/[id]` | Operation detail |
| `/ai-planner` | AI operation planner |
| `/coalitions` | Browse coalitions |
| `/notifications` | Notifications |

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| Site Admin | Full access |
| Organization Owner | Manage org, members, operations |
| Organization Officer | Invite members, manage operations |
| Operation Commander | Create/edit operations, assign roles |
| Team Leader | Manage team assignments |
| Member | Join operations, RSVP, comment |
| Guest | View public content |

## Roadmap

- [ ] Real-time operation updates (WebSockets / SSE)
- [ ] Operation map with location markers
- [ ] Discord integration for notifications
- [ ] Mobile app (React Native)
- [ ] Voice channel integration
- [ ] Ship loadout builder
- [ ] Operation replay / history
- [ ] Advanced analytics dashboard
- [ ] Alliance treaty system
- [ ] Automated operation scheduling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT
