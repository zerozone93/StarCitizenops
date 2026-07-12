import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

export async function GET() {
  const startedAt = Date.now();
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'drake-ops-logistics-ledger',
        checks: {
          database: 'missing DATABASE_URL',
        },
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      service: 'drake-ops-logistics-ledger',
      checks: {
        database: 'reachable',
      },
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'drake-ops-logistics-ledger',
        checks: {
          database: 'unreachable',
        },
        error: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 503 }
    );
  }
}
