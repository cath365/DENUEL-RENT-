import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { z } from 'zod';

const QuerySchema = z.object({ q: z.string().min(1) });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { q } = QuerySchema.parse(Object.fromEntries(url.searchParams));

    // simple suggestions from property titles and cities
    const titles = await prisma.property.findMany({ where: { OR: [ { title: { contains: q } }, { city: { contains: q } } ] }, take: 8 });
    const suggestions = titles.map((t) => ({ id: t.id, title: t.title, city: t.city }));
    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}