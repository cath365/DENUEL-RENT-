import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const { isAvailable } = await req.json();
    
    // Update availability
    await prisma.serviceProvider.update({
      where: { userId: user.id },
      data: { isAvailable }
    });

    return NextResponse.json({ success: true, isAvailable });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Service availability error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to update availability' }, { status: 500 });
  }
}
