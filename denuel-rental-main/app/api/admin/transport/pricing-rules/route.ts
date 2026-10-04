import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireCsrf } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const VehicleTypeSchema = z.enum([
  'MOTORBIKE',
  'CAR',
  'SUV',
  'VAN',
  'TRUCK_SMALL',
  'TRUCK_MEDIUM',
  'TRUCK_LARGE',
]);

const PricingRuleSchema = z.object({
  id: z.string().cuid().optional(),
  vehicleType: VehicleTypeSchema,
  baseFareZmw: z.number().int().nonnegative(),
  perKmZmw: z.number().int().nonnegative(),
  perMinZmw: z.number().int().nonnegative(),
  minimumFareZmw: z.number().int().nonnegative(),
  surgeMultiplier: z.number().min(1).max(5),
  nightMultiplier: z.number().min(1).max(5),
  weatherMultiplier: z.number().min(1).max(5),
  isActive: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);

    const rules = await prisma.pricingRule.findMany({
      orderBy: [
        { vehicleType: 'asc' },
        { isActive: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Transport pricing rules fetch error:', error);
    return NextResponse.json({ error: 'Unable to load pricing rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    requireCsrf(req);

    const parsed = PricingRuleSchema.parse(await req.json());

    const rule = await prisma.$transaction(async (tx) => {
      if (parsed.isActive) {
        await tx.pricingRule.updateMany({
          where: {
            vehicleType: parsed.vehicleType,
            ...(parsed.id ? { id: { not: parsed.id } } : {}),
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      if (parsed.id) {
        const existing = await tx.pricingRule.findUnique({
          where: { id: parsed.id },
          select: { id: true },
        });

        if (!existing) {
          throw new Error('PRICING_RULE_NOT_FOUND');
        }

        return tx.pricingRule.update({
          where: { id: parsed.id },
          data: {
            vehicleType: parsed.vehicleType,
            baseFareZmw: parsed.baseFareZmw,
            perKmZmw: parsed.perKmZmw,
            perMinZmw: parsed.perMinZmw,
            minimumFareZmw: parsed.minimumFareZmw,
            surgeMultiplier: parsed.surgeMultiplier,
            nightMultiplier: parsed.nightMultiplier,
            weatherMultiplier: parsed.weatherMultiplier,
            isActive: parsed.isActive,
          },
        });
      }

      return tx.pricingRule.create({
        data: {
          vehicleType: parsed.vehicleType,
          baseFareZmw: parsed.baseFareZmw,
          perKmZmw: parsed.perKmZmw,
          perMinZmw: parsed.perMinZmw,
          minimumFareZmw: parsed.minimumFareZmw,
          surgeMultiplier: parsed.surgeMultiplier,
          nightMultiplier: parsed.nightMultiplier,
          weatherMultiplier: parsed.weatherMultiplier,
          isActive: parsed.isActive,
        },
      });
    });

    return NextResponse.json(
      { rule },
      { status: parsed.id ? 200 : 201 },
    );
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    if (error?.message === 'PRICING_RULE_NOT_FOUND') {
      return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 });
    }
    console.error('Transport pricing rule save error:', error);
    return NextResponse.json({ error: 'Unable to save pricing rule' }, { status: 500 });
  }
}
