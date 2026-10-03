import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch activity logs (placeholder for now)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ["ADMIN"]);
    
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    // TODO: Implement actual activity logging system
    // For now, return empty array with structure
    const activities: any[] = [];

    return NextResponse.json({ activities });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch activities" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
