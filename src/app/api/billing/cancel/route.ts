import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await req.json().catch(() => ({}));

    const householdId = session?.householdId || body.householdId;
    if (!householdId) {
      return NextResponse.json({ error: "Household ID or authentication required" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { householdId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Cancel at period end - retaining access
    const updated = await prisma.subscription.update({
      where: { householdId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription set to cancel at period end. Access is retained until then.",
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd,
      status: updated.status,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
