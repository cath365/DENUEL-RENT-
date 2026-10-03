import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Calculate trust score based on multiple factors
async function calculateTrustScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviewsReceived: true,
      properties: true,
      verificationDocs: {
        where: { status: "APPROVED" },
      },
    },
  });

  if (!user) return 0;

  let score = 0;

  // Base score for account age (max 15 points)
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(accountAgeDays / 30, 15); // 0.5 points per day, max 15

  // Email verification (10 points)
  if (user.isEmailVerified) score += 10;

  // Phone verification (10 points)
  if (user.isPhoneVerified) score += 10;

  // ID verification (20 points)
  if (user.isIdVerified) score += 20;

  // Business verification (15 points)
  if (user.isBusinessVerified) score += 15;

  // Additional verified documents (2 points each, max 10)
  score += Math.min(user.verificationDocs.length * 2, 10);

  // Reviews (max 20 points)
  if (user.reviewsReceived.length > 0) {
    const avgRating =
      user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
      user.reviewsReceived.length;
    const reviewCount = Math.min(user.reviewsReceived.length, 10);
    score += (avgRating / 5) * 15 + reviewCount * 0.5;
  }

  // Active properties (max 10 points)
  const activeProps = user.properties.filter((p) => p.status === "APPROVED").length;
  score += Math.min(activeProps, 10);

  return Math.min(Math.round(score), 100);
}

// GET - Get verification status
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const verificationData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
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
          orderBy: { submittedAt: "desc" },
        },
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // Calculate and update trust score
    const newTrustScore = await calculateTrustScore(user.id);
    if (verificationData && Math.abs(verificationData.trustScore - newTrustScore) > 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: { trustScore: newTrustScore },
      });
      verificationData.trustScore = newTrustScore;
    }

    return NextResponse.json(verificationData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch verification status" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// POST - Submit verification document
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const { documentType, documentUrl, metadata } = body;

    if (!documentType || !documentUrl) {
      return NextResponse.json(
        { error: "Document type and URL are required" },
        { status: 400 }
      );
    }

    const document = await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        documentType,
        documentUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit document" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH - Update verification info (NRC, business license, etc)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const { nrcNumber, businessLicense, companyName } = body;

    const updateData: any = {};
    if (nrcNumber) updateData.nrcNumber = nrcNumber;
    if (businessLicense) updateData.businessLicense = businessLicense;
    if (companyName) updateData.companyName = companyName;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update verification info" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
