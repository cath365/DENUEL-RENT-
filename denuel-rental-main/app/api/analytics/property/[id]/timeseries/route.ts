import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const days = Number(new URL(req.url).searchParams.get('days') || '30');
    const since = new Date();
    since.setDate(since.getDate() - days + 1);

    const views = await prisma.propertyView.findMany({ where: { propertyId: id, createdAt: { gte: since } }, orderBy: { createdAt: 'asc' } });

    // reduce to counts per day
    const data: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      data[key] = 0;
    }

    for (const v of views) {
      const k = v.createdAt.toISOString().slice(0, 10);
      if (data[k] === undefined) data[k] = 0;
      data[k]++;
    }

    const result = Object.keys(data).sort().map((k) => ({ date: k, count: data[k] }));

    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}