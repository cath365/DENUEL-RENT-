import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// simple endpoint to get basic search stats for analytics
export async function GET() {
  try {
    const topCities = await prisma.property.groupBy({ by: ['city'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 });
    return NextResponse.json({ topCities });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}