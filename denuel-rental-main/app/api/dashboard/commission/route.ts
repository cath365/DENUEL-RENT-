import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch commission records for agent/landlord
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Fetch all bookings for the user's properties
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
      },
      include: {
        property: {
          select: {
            title: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate commission (15% of booking amount)
    const records = bookings.map((booking) => {
      const commission = booking.amountZmw * 0.15;
      return {
        id: booking.id,
        propertyTitle: booking.property.title,
        tenantName: booking.tenant.name || "Anonymous",
        amount: booking.amountZmw,
        commission: Math.round(commission),
        date: booking.createdAt,
        status: booking.status === "CONFIRMED" ? "PAID" : "PENDING",
      };
    });

    // Calculate stats
    const totalEarned = records
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.commission, 0);

    const pending = records
      .filter((r) => r.status === "PENDING")
      .reduce((sum, r) => sum + r.commission, 0);

    const paid = totalEarned;

    // This month's earnings
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = records
      .filter(
        (r) =>
          r.status === "PAID" &&
          new Date(r.date) >= firstDayOfMonth
      )
      .reduce((sum, r) => sum + r.commission, 0);

    const stats = {
      totalEarned,
      pending,
      paid,
      thisMonth,
    };

    return NextResponse.json({ records, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch commission data" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
