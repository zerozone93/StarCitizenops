# Star Citizen Ops Logistics

Tool name: Drake Ops Logistics Ledger

This repository contains the logistics module for Star Citizen Ops, including:
- member intake and request workflows
- inventory, refining, and ticket archive flows
- permission-gated route access beyond front page
- Neon/Postgres-backed admin assignment endpoints

## Neon + Prisma setup

1. Create a Neon Postgres project.
2. Copy the pooled connection string.
3. Add environment variables:

```bash
DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"
STAROPS_DEFAULT_ROLE="LOGISTICS_ADMIN"
STAROPS_DEFAULT_USER_ID="scops-user-001"
STAROPS_DEFAULT_ORG_ID="org-demo-01"
STAROPS_PERMISSION_BYPASS="false"
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Apply schema to Neon (development path):

```bash
npx prisma db push
```

## Permission model integration

Server permission checks read Star Citizen Ops auth context from request headers:
- x-scops-user-id
- x-scops-org-id
- x-scops-role
- x-scops-permissions (comma-separated)

Protected routes:
- /logistics requires logistics.tool.access + logistics.view
- /logistics/admin requires logistics.settings.manage or logistics.admins.assign

Admin assignment API:
- GET /api/logistics/admins
- POST /api/logistics/admins
- DELETE /api/logistics/admins

Tool registration endpoint:
- GET /api/tools/ops-logistics-ledger

## Run

```bash
npm install
npm test
npm run build
npm run start -- -p 3000
```

## Repository file index

The following tree documents the current project files and folders used by the app (generated directories such as `.next/` and dependency directories such as `node_modules/` are excluded):

```text
.
|-- .env.example
|-- .gitignore
|-- README.md
|-- next-env.d.ts
|-- next.config.js
|-- package-lock.json
|-- package.json
|-- tsconfig.json
|-- tsconfig.tsbuildinfo
|-- vitest.config.ts
|-- star-citizen-invantory-and-industrial-.zip
|-- app/
|   |-- globals.css
|   |-- layout.tsx
|   |-- page.tsx
|   |-- api/
|   |   |-- health/route.ts
|   |   |-- logistics/
|   |   |   |-- admins/route.ts
|   |   |   |-- catalog-sync/route.ts
|   |   |   `-- scan/route.ts
|   |   `-- tools/
|   |       `-- ops-logistics-ledger/route.ts
|   `-- logistics/
|       |-- layout.tsx
|       |-- page.tsx
|       |-- admin/page.tsx
|       |-- materials/page.tsx
|       |-- refinery/page.tsx
|       |-- requests/page.tsx
|       |-- scanner/page.tsx
|       `-- stock/page.tsx
|-- docs/
|   `-- logistics/
|       |-- AI-SCANNER.md
|       |-- ARCHITECTURE.md
|       |-- DATABASE.md
|       |-- DISCORD.md
|       |-- EXPORTS.md
|       |-- GOOGLE-SHEETS.md
|       |-- IMPLEMENTATION-PLAN.md
|       |-- IMPORTS.md
|       |-- ITEM-RESEARCH-AND-ENTRY-MODEL.md
|       |-- MINING-STOCKKEEPING-RESEARCH.md
|       |-- ORE-QUALITY-MARKERS.md
|       |-- PERMISSIONS.md
|       |-- README.md
|       `-- STAROPS-LIVE-HANDOVER.md
|-- prisma/
|   `-- schema.prisma
|-- scripts/
|   `-- ensure-vitest-jsx.cjs
`-- src/
	|-- app/
	|   |-- globals.css
	|   |-- layout.tsx
	|   `-- page.tsx
	|-- components/
	|   |-- AdminActionPanel.tsx
	|   |-- LogisticsAdminAssignmentPanel.tsx
	|   |-- ManualStockEditor.tsx
	|   |-- MemberSubmissionPortal.tsx
	|   |-- OrgAccessGate.tsx
	|   |-- OrgMembershipGate.tsx
	|   |-- ResourceRequestForm.tsx
	|   |-- forms-and-portal.test.tsx
	|   `-- logistics/
	|       |-- AdminTabs.tsx
	|       |-- DashboardPanel.tsx
	|       |-- RefineryPanel.tsx
	|       |-- StockPanel.tsx
	|       `-- TicketsPanel.tsx
	|-- data/
	|   |-- logistics-catalog.ts
	|   |-- logistics-demo.ts
	|   `-- materials-demo.ts
	|-- lib/
	|   |-- access.ts
	|   |-- ai-scanner-client.ts
	|   |-- catalog-sync-client.ts
	|   |-- catalog-sync.ts
	|   |-- logistics-permissions.ts
	|   |-- org-membership.ts
	|   |-- prisma.ts
	|   |-- server-permissions.ts
	|   `-- tool-config.ts
	|-- modules/
	|   `-- logistics/
	|       |-- index.ts
	|       |-- services.ts
	|       `-- types.ts
	`-- test/
		`-- setup.ts
```

## Live deployment handoff for Star Citizen Ops

1. Configure Neon DATABASE_URL in deployment environment.
2. Configure upstream auth proxy/provider to forward x-scops-* headers.
3. Run npx prisma db push as part of release migration step.
4. Deploy this Next.js app to your Star Citizen Ops frontend provider.
5. Add Drake Ops Logistics Ledger link in Star Citizen Ops Tools menu to /logistics.
