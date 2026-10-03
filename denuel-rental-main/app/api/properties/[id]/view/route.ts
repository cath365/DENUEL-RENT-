import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { z } from 'zod';

const BodySchema = z.object({ ip: z.string().optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    // create a PropertyView and increment viewCount
    const view = await prisma.$transaction(async (tx) => {
      const v = await tx.propertyView.create({ data: { propertyId: id, ip: parsed.ip || '' } });
      await tx.property.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      return v;
    });

    return NextResponse.json({ ok: true, view });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
