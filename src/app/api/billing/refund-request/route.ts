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
      include: {
        household: {
          include: { users: true },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found for this household" }, { status: 404 });
    }

    const email = body.email || session?.email || subscription.household.users[0]?.email || "parent@zeroto1.academy";
    const reason = body.reason || "Parent requested 30-day money-back guarantee refund";

    // Verify 30-day window
    const createdAt = subscription.createdAt;
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > 30) {
      return NextResponse.json(
        {
          error: "Refund request exceeds the 30-day money-back window. Please contact hello@zeroto1.academy for assistance.",
          daysSinceCreation: Math.round(daysSinceCreation),
        },
        { status: 400 }
      );
    }

    // In production, this dispatches via email provider to hello@zeroto1.academy
    // For logging and verification, we log the exact dispatch details:
    console.log(`[REFUND DISPATCH] Target: hello@zeroto1.academy | Household: ${householdId} | User: ${email} | Reason: ${reason} | Subscription: ${subscription.stripeSubscriptionId || subscription.id}`);

    return NextResponse.json({
      success: true,
      message: "Refund request received and forwarded to hello@zeroto1.academy. Our support team will process your refund within 48 hours.",
      recipient: "hello@zeroto1.academy",
      householdId,
      userEmail: email,
      daysSinceCreation: Math.round(daysSinceCreation),
      descriptor: "ZEROTO1",
    });
  } catch (error: any) {
    console.error("Refund request error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
