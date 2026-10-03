import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all verification documents (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    const documents = await prisma.verificationDocument.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            trustScore: true,
            isIdVerified: true,
            isBusinessVerified: true,
            isPhoneVerified: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// PATCH - Review verification document (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    const body = await req.json();

    const { documentId, status, reviewNotes } = body;

    if (!documentId || !status) {
      return NextResponse.json(
        { error: "Document ID and status are required" },
        { status: 400 }
      );
    }

    // Update document
    const document = await prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status,
        reviewNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    // Update user verification fields based on document type
    if (status === "APPROVED") {
      const updateData: any = {};

      switch (document.documentType) {
        case "NATIONAL_ID":
        case "PASSPORT":
        case "NRC":
          updateData.isIdVerified = true;
          break;
        case "BUSINESS_LICENSE":
        case "LICENSE":
          updateData.isBusinessVerified = true;
          break;
      }

      // Set verifiedAt if this is first verification
      if (!document.user.verifiedAt) {
        updateData.verifiedAt = new Date();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: document.userId },
          data: updateData,
        });
      }

      // Recalculate trust score
      await recalculateTrustScore(document.userId);
    }

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to review document" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

async function recalculateTrustScore(userId: string) {
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

  if (!user) return;

  let score = 0;

  // Account age (max 15)
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(accountAgeDays / 30, 15);

  // Verifications
  if (user.isEmailVerified) score += 10;
  if (user.isPhoneVerified) score += 10;
  if (user.isIdVerified) score += 20;
  if (user.isBusinessVerified) score += 15;
  score += Math.min(user.verificationDocs.length * 2, 10);

  // Reviews
  if (user.reviewsReceived.length > 0) {
    const avgRating =
      user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
      user.reviewsReceived.length;
    score += (avgRating / 5) * 15 + Math.min(user.reviewsReceived.length * 0.5, 5);
  }

  // Active properties
  const activeProps = user.properties.filter((p) => p.status === "APPROVED").length;
  score += Math.min(activeProps, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: Math.min(Math.round(score), 100) },
  });
}
