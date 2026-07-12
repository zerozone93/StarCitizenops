# StarCitizenOps MVP Launch Checklist

This runbook is the release gate for production deployment on Vercel + Neon.

## 1. Preflight (local)

Owner: Engineering

Pass criteria:
- Lint passes
- Typecheck passes
- Unit tests pass
- Production build passes
- E2E smoke tests pass

Run:

1. npm install
2. npm run preflight:release

## 2. Secrets and environment setup (Vercel)

Owner: Engineering

Pass criteria:
- All required environment variables exist in Vercel Production
- NEXTAUTH_SECRET is a strong generated secret
- NEXTAUTH_URL matches the production domain
- DATABASE_URL uses Neon pooled connection
- DIRECT_DATABASE_URL uses Neon direct (non-pooled) connection
- No real secrets are present in repository files

Use .env.example as the only template source.

## 3. Neon production database

Owner: Engineering

Pass criteria:
- Neon production project and DB created
- Production DATABASE_URL and DIRECT_DATABASE_URL set in Vercel
- DB connectivity test succeeds
- Destructive seed/reset flows are blocked for production by default

## 4. Production migration

Owner: Engineering

Pass criteria:
- All Prisma migrations applied in production
- Latest migration exists and is applied:
  - prisma/migrations/20260607145524_add_user_security_fields/migration.sql

Suggested command in deployment environment:

1. npx prisma migrate deploy

Do not run `npm run db:seed` against production Neon. The seed script is destructive and should only be used for local databases or explicitly approved staging/test environments.

## 5. Deploy to Vercel

Owner: Engineering

Pass criteria:
- Deployment succeeds
- No runtime crash on first boot
- Health route and main pages load

## 6. Post-deploy smoke test

Owner: QA/Engineering

Pass criteria:
- Login works
- Dashboard loads for authenticated user
- Operation creation flow works
- Key API routes respond as expected

## 7. Security advisory policy

Current status:
- npm audit reports 3 moderate vulnerabilities tied to Prisma dev chain.

Risk note:
- Remaining advisories require a breaking Prisma major-line change to fully remove.
- If launching now, record this exception in release notes and track a follow-up ticket.

## 8. Rollback readiness

Owner: Engineering

Pass criteria:
- Previous Vercel deployment is available for instant rollback
- Neon backup/restore policy confirmed
- Incident contact path documented

## 9. Launch sign-off

Owner: Product + Engineering

Pass criteria:
- All above sections marked complete
- Release tag created
- Monitoring and alerting enabled

## 10. Neon credential rotation runbook

Owner: Engineering

When to run:
- After any credential exposure incident
- At regular security rotation intervals

Steps:
1. Rotate the Neon database user password in Neon SQL editor or `psql` using `ALTER USER ... WITH PASSWORD ...`.
2. Update Vercel Production environment variables:
  - `DATABASE_URL` (Neon pooled URL)
  - `DIRECT_DATABASE_URL` (Neon direct URL)
3. Run production migration validation:
  - `npx prisma migrate deploy`
4. Redeploy production:
  - `npx vercel deploy --prod --yes`
5. Confirm health:
  - Domain returns HTTP 200
  - App can connect to database without auth or connection errors
