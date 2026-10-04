import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireCsrf } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { publicServerError } from '@/lib/publicError';
import { verifyObject } from '@/lib/s3';

export const dynamic = 'force-dynamic';

const DOCUMENT_TYPES = new Set([
  'NATIONAL_ID',
  'PASSPORT',
  'BUSINESS_LICENSE',
  'PROOF_OF_ADDRESS',
  'PROPERTY_TITLE',
  'TAX_CLEARANCE',
  'NRC',
  'CERTIFICATE',
  'LICENSE',
  'INSURANCE',
  'QUALIFICATION',
  'REFERENCE',
  'PORTFOLIO',
  'ID_PHOTO',
  'BACKGROUND_CHECK',
  'OTHER',
]);

async function calculateTrustScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviewsReceived: true,
      properties: true,
      verificationDocs: {
        where: { status: 'APPROVED' },
      },
    },
  });

  if (!user) return 0;

  let score = 0;
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  score += Math.min(accountAgeDays / 30, 15);
  if (user.isEmailVerified) score += 10;
  if (user.isPhoneVerified) score += 10;
  if (user.isIdVerified) score += 20;
  if (user.isBusinessVerified) score += 15;
  score += Math.min(user.verificationDocs.length * 2, 10);

  if (user.reviewsReceived.length > 0) {
    const avgRating =
      user.reviewsReceived.reduce(
        (sum, review) => sum + review.rating,
        0
      ) / user.reviewsReceived.length;

    score +=
      (avgRating / 5) * 15 +
      Math.min(user.reviewsReceived.length, 10) * 0.5;
  }

  const activeProperties = user.properties.filter(
    (property) => property.status === 'APPROVED'
  ).length;

  score += Math.min(activeProperties, 10);

  return Math.min(Math.round(score), 100);
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const verificationData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdVerified: true,
        isBusinessVerified: true,
        trustScore: true,
        verifiedAt: true,
        nrcNumber: true,
        businessLicense: true,
        companyName: true,
        verificationDocs: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!verificationData) {
      return NextResponse.json(
        { error: 'Verification profile not found.' },
        { status: 404 }
      );
    }

    const newTrustScore = await calculateTrustScore(user.id);

    if (
      Math.abs(
        Number(verificationData.trustScore || 0) - newTrustScore
      ) > 1
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { trustScore: newTrustScore },
      });
      verificationData.trustScore = newTrustScore;
    }

    return NextResponse.json(verificationData);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Verification status failed', error);
    const safe = publicServerError(
      error,
      'Unable to load verification status.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const documentType =
      typeof body.documentType === 'string'
        ? body.documentType
        : '';
    const documentKey =
      typeof body.documentKey === 'string'
        ? body.documentKey.trim()
        : '';

    if (
      !DOCUMENT_TYPES.has(documentType) ||
      !documentKey ||
      !documentKey.startsWith(`verification/${user.id}/`)
    ) {
      return NextResponse.json(
        { error: 'A valid privately uploaded verification document is required.' },
        { status: 400 }
      );
    }

    const object = await verifyObject(documentKey);

    const allowed =
      object.contentType === 'application/pdf' ||
      object.contentType === 'image/jpeg' ||
      object.contentType === 'image/png' ||
      object.contentType === 'image/webp';

    if (!allowed || object.size <= 0 || object.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'The uploaded verification file is invalid or too large.' },
        { status: 400 }
      );
    }

    const document = await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        documentType: documentType as any,
        documentUrl: `s3-private:${documentKey}`,
        metadata: JSON.stringify({
          fileName:
            typeof body.metadata?.fileName === 'string'
              ? body.metadata.fileName
              : null,
          fileSize: object.size,
          mimeType: object.contentType,
          storage: 'S3_PRIVATE',
        }),
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Verification submission failed', error);
    const safe = publicServerError(
      error,
      'Unable to submit this verification document.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const updateData: Record<string, string | null> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nrcNumber')) {
      updateData.nrcNumber =
        typeof body.nrcNumber === 'string' &&
        body.nrcNumber.trim()
          ? body.nrcNumber.trim().slice(0, 80)
          : null;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'businessLicense')) {
      updateData.businessLicense =
        typeof body.businessLicense === 'string' &&
        body.businessLicense.trim()
          ? body.businessLicense.trim().slice(0, 120)
          : null;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'companyName')) {
      updateData.companyName =
        typeof body.companyName === 'string' &&
        body.companyName.trim()
          ? body.companyName.trim().slice(0, 180)
          : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No verification information was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        nrcNumber: true,
        businessLicense: true,
        companyName: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Verification info update failed', error);
    const safe = publicServerError(
      error,
      'Unable to update verification information.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
