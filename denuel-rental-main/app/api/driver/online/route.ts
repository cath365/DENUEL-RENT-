import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

    const body = await req.json();
    const online = Boolean(body.online);

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { isSuspended: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    if (online && (profile.user.isSuspended || !profile.isApproved || profile.verificationStatus !== 'VERIFIED')) {
      return NextResponse.json(
        { error: 'Driver approval and verification are required before going online.' },
        { status: 403 }
      );
    }

    const updated = await prisma.driverProfile.update({
      where: { id: profile.id },
      data: { isOnline: online },
      select: { isOnline: true },
    });

    return NextResponse.json({ ok: true, isOnline: updated.isOnline });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver online status error:', error);
    return NextResponse.json({ error: 'Unable to update online status' }, { status: 500 });
  }
}
