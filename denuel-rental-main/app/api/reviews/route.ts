import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Submit a review for a user (agent/landlord)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const { reviewedId, rating, comment, propertyId, isVerified } = body;

    if (!reviewedId || !rating) {
      return NextResponse.json(
        { error: "Reviewed user ID and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if reviewer already reviewed this user
    const existing = await prisma.userReview.findFirst({
      where: {
        reviewerId: user.id,
        reviewedId,
        propertyId: propertyId || undefined,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this user" },
        { status: 400 }
      );
    }

    const review = await prisma.userReview.create({
      data: {
        reviewerId: user.id,
        reviewedId,
        rating,
        comment,
        propertyId,
        isVerified: isVerified || false,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            trustScore: true,
          },
        },
      },
    });

    // Update trust score of the reviewed user
    const reviewedUser = await prisma.user.findUnique({
      where: { id: reviewedId },
      include: { reviewsReceived: true },
    });

    if (reviewedUser) {
      const avgRating =
        reviewedUser.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
        reviewedUser.reviewsReceived.length;
      const reviewBonus = Math.min((avgRating / 5) * 15, 15);
      
      await prisma.user.update({
        where: { id: reviewedId },
        data: {
          trustScore: Math.min(reviewedUser.trustScore + reviewBonus / 10, 100),
        },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit review" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

// GET - Get reviews for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const reviews = await prisma.userReview.findMany({
      where: {
        reviewedId: userId,
        isPublic: true,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            trustScore: true,
            isIdVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      count: reviews.length,
      averageRating: avgRating,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
