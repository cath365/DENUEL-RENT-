import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch system status and health metrics
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    
    // Check database connection
    const dbStart = Date.now();
    const dbTest = await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get platform statistics
    const [userCount, propertyCount, bookingCount, messageCount] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.message.count(),
    ]);

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Calculate uptime (in seconds)
    const uptime = process.uptime();

    const systemStatus = {
      status: "healthy",
      uptime: Math.floor(uptime),
      version: "1.0.0",
      database: {
        status: dbTest ? "connected" : "disconnected",
        latency: dbLatency,
      },
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      stats: {
        users: userCount,
        properties: propertyCount,
        bookings: bookingCount,
        messages: messageCount,
      },
    };

    return NextResponse.json(systemStatus);
  } catch (error: any) {
    console.error("System status error:", error);
    return NextResponse.json(
      { 
        status: "error",
        error: error.message || "Failed to fetch system status" 
      },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
