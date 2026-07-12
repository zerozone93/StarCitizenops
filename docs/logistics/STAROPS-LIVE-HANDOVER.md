# Star Citizen Ops Live Handover

Tool: Drake Ops Logistics Ledger

This runbook is the deployment handoff for moving the logistics module live in Star Citizen Ops with Neon database and permission-controlled access.

## 1. Infrastructure prerequisites

- Neon Postgres project created.
- Frontend hosting provider ready (Vercel/Netlify/Cloud Run/other).
- Star Citizen Ops gateway/auth proxy configured to forward org/user/role headers.

Required headers forwarded to this app:
- x-scops-user-id
- x-scops-org-id
- x-scops-role
- x-scops-permissions (optional comma-separated)

## 2. Environment variables

Set these in the deployment provider:

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- STAROPS_DEFAULT_ROLE
- STAROPS_DEFAULT_USER_ID
- STAROPS_DEFAULT_ORG_ID
- STAROPS_PERMISSION_BYPASS=false

## 3. Database provisioning (Neon)

Run once against the production branch environment:

```bash
npm ci
npm run db:generate
npm run db:push
```

## 4. Build and release verification

```bash
npm run prepare:deploy
```

This executes Prisma client generation and full test/build verification.

## 5. Deploy and register tool in Star Citizen Ops

- Deploy the app using provider standard flow.
- Register the tool route in Star Citizen Ops tools registry/menu:
  - name: Drake Ops Logistics Ledger
  - route: /logistics
  - admin route: /logistics/admin
  - metadata endpoint: /api/tools/ops-logistics-ledger

## 6. Permission behavior after go-live

- Route /logistics is blocked unless user has:
  - logistics.tool.access
  - logistics.view
- Route /logistics/admin is blocked unless user has either:
  - logistics.settings.manage
  - logistics.admins.assign

## 7. Admin assignment operations

API endpoints:
- GET /api/logistics/admins
- POST /api/logistics/admins
- DELETE /api/logistics/admins

UI path:
- /logistics/admin

## 8. Post-deploy smoke checks

- Health endpoint: /api/health
  - expects status: ok
- Tool config endpoint: /api/tools/ops-logistics-ledger
- Permission gate checks:
  - unauthorized user redirected from /logistics
  - authorized logistics admin can access /logistics/admin

## 9. Rollback plan

- Revert deployment to previous release.
- Keep Neon schema as-is (forward compatible model additions only).
- If emergency lock needed: set STAROPS_PERMISSION_BYPASS=false and remove tool permissions at gateway layer.
