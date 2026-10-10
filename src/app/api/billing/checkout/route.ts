import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillingCheckoutSession, STATEMENT_DESCRIPTOR } from "@/lib/billing/stripe";
import { Region } from "@/lib/region";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await req.json().catch(() => ({}));

    // Allow householdId from session or body (for API testing)
    const householdId = session?.householdId || body.householdId;
    if (!householdId) {
      return NextResponse.json(
        { error: "Authentication required or householdId missing" },
        { status: 401 }
      );
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: { users: true },
    });

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 });
    }

    const plan: "MONTHLY" | "YEARLY" = body.plan === "YEARLY" ? "YEARLY" : "MONTHLY";
    const region: Region = (body.region as Region) || (household.region as Region) || "US";
    const userEmail = session?.email || household.users[0]?.email || "parent@zeroto1.academy";

    const origin = req.nextUrl.origin || "http://localhost:3001";
    const successUrl = body.successUrl || `${origin}/app/parent/billing?status=success`;
    const cancelUrl = body.cancelUrl || `${origin}/pricing?canceled=true`;

    const result = await createBillingCheckoutSession({
      householdId,
      email: userEmail,
      plan,
      region,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      sessionId: result.sessionId,
      mode: result.mode,
      statementDescriptor: STATEMENT_DESCRIPTOR,
      plan,
      region,
    });
  } catch (error: any) {
    console.error("Billing checkout session error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
