import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getUser } from '../../../../../lib/auth';
import { publicServerError } from '../../../../../lib/publicError';

function visitorSignature(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip =
    forwarded.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const salt =
    process.env.ANALYTICS_HASH_SALT ||
    process.env.JWT_SECRET ||
    'nganda-property-view';

  return createHash('sha256')
    .update(salt + '|' + ip + '|' + userAgent)
    .digest('hex');
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!property || property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Property not found.' },
        { status: 404 }
      );
    }

    const user = await getUser(req);

    // Owners and administrators do not increase public viewer counts.
    if (
      user &&
      (user.id === property.ownerId || user.role === 'ADMIN')
    ) {
      return NextResponse.json({
        counted: false,
        reason: 'owner_or_admin',
      });
    }

    const signature = visitorSignature(req);

    const existing = await prisma.propertyView.findFirst({
      where: {
        propertyId: property.id,
        ip: signature,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        counted: false,
        reason: 'already_counted',
      });
    }

    await prisma.$transaction([
      prisma.propertyView.create({
        data: {
          propertyId: property.id,
          // This field stores a one-way visitor signature, never the raw IP.
          ip: signature,
        },
      }),
      prisma.property.update({
        where: { id: property.id },
        data: {
          viewCount: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ counted: true });
  } catch (error) {
    console.error('Property view tracking failed', error);
    const safe = publicServerError(
      error,
      'Unable to record this property view.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
