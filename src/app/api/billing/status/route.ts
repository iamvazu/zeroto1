import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getHouseholdEntitlement } from "@/lib/billing/entitlements";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const queryHouseholdId = req.nextUrl.searchParams.get("householdId");

    const householdId = session?.householdId || queryHouseholdId;

    if (!householdId) {
      return NextResponse.json({ error: "Household ID or authentication required" }, { status: 401 });
    }

    const entitlement = await getHouseholdEntitlement(householdId);

    return NextResponse.json({
      success: true,
      householdId,
      ...entitlement,
    });
  } catch (error: any) {
    console.error("Billing status error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
