# Neon Database Reset Instructions

Your production Neon database (project: calm-hall-65922298) has exceeded the data transfer quota and needs to be reset.

## Option 1: Using Neon Dashboard (Recommended)

1. Go to https://console.neon.tech
2. Select project "calm-hall-65922298"
3. Go to **Databases** → Select `neondb`
4. Click **Delete Database**
5. Click **Create Database** to recreate `neondb`
6. Verify connection strings in Vercel project settings

## Option 2: Using Neon API

```bash
# List branches (find your main branch ID)
curl -X GET "https://api.neon.tech/v2/projects/calm-hall-65922298/branches" \
  -H "Authorization: Bearer $NEON_API_KEY"

# Delete the database
curl -X DELETE "https://api.neon.tech/v2/projects/calm-hall-65922298/databases/neondb" \
  -H "Authorization: Bearer $NEON_API_KEY"

# Recreate the database
curl -X POST "https://api.neon.tech/v2/projects/calm-hall-65922298/databases" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"neondb"}'
```

## After Reset: Run Vercel Production Migration Deploy

Once the database is reset in Neon:

1. Verify DATABASE_URL and DIRECT_DATABASE_URL are set in Vercel production
2. Run: `npx prisma migrate deploy` against production
3. Seed demo data (optional): `VERCEL_ENV=production npx tsx prisma/seed.ts`
4. Redeploy on Vercel with `npx vercel deploy --prod`

## Verify after Reset

```bash
curl https://www.starcitizenopps.com/api/organizations/list
# Should return JSON array of organizations, not 500 error
```
