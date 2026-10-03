import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch marketing stats and property performance
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Fetch user's properties with related data
    const properties = await prisma.property.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        _count: {
          select: {
            favorites: true,
            inquiries: true,
            views: true,
          },
        },
      },
    });

    // Calculate performance metrics for each property
    const propertyPerformance = properties.map((property) => {
      const views = property._count.views;
      const inquiries = property._count.inquiries;
      const favorites = property._count.favorites;
      const conversionRate = views > 0 ? (inquiries / views) * 100 : 0;

      return {
        id: property.id,
        title: property.title,
        views,
        inquiries,
        favorites,
        conversionRate,
      };
    });

    // Calculate overall stats
    const totalViews = properties.reduce((sum, p) => sum + p._count.views, 0);
    const totalInquiries = propertyPerformance.reduce(
      (sum, p) => sum + p.inquiries,
      0
    );
    const totalFavorites = propertyPerformance.reduce(
      (sum, p) => sum + p.favorites,
      0
    );
    const conversionRate =
      totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

    const stats = {
      totalViews,
      totalInquiries,
      totalFavorites,
      conversionRate,
    };

    // Sort properties by conversion rate (best performing first)
    propertyPerformance.sort((a, b) => b.conversionRate - a.conversionRate);

    return NextResponse.json({
      stats,
      properties: propertyPerformance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch marketing data" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
