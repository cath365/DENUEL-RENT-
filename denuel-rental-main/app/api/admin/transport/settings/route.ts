import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireCsrf } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const SettingsSchema = z.object({
  surgeEnabled: z.boolean(),
  maxSurgeMultiplier: z.number().min(1).max(5),
  maxNightMultiplier: z.number().min(1).max(5),
  maxWeatherMultiplier: z.number().min(1).max(5),
  nightStartHour: z.number().int().min(0).max(23),
  nightEndHour: z.number().int().min(0).max(23),
  surgeWindowMinutes: z.number().int().min(1).max(120),
  surgeMinDelta: z.number().int().min(1).max(1000),
});

const DEFAULTS = {
  surgeEnabled: true,
  maxSurgeMultiplier: 1.3,
  maxNightMultiplier: 1.15,
  maxWeatherMultiplier: 1.1,
  nightStartHour: 21,
  nightEndHour: 5,
  surgeWindowMinutes: 5,
  surgeMinDelta: 1,
};

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);

    const settings = await prisma.transportSettings.findFirst();
    return NextResponse.json({
      settings: settings || DEFAULTS,
      persisted: Boolean(settings),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Transport settings fetch error:', error);
    return NextResponse.json({ error: 'Unable to load transport settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    requireCsrf(req);

    const parsed = SettingsSchema.parse(await req.json());
    const existing = await prisma.transportSettings.findFirst();

    const settings = existing
      ? await prisma.transportSettings.update({
          where: { id: existing.id },
          data: parsed,
        })
      : await prisma.transportSettings.create({
          data: parsed,
        });

    return NextResponse.json(
      { settings, persisted: true },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Transport settings save error:', error);
    return NextResponse.json({ error: 'Unable to save transport settings' }, { status: 500 });
  }
}
