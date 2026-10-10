import { prisma } from "../prisma";
import { STATEMENT_DESCRIPTOR } from "./stripe";

export interface EntitlementStatus {
  isEntitled: boolean;
  status: "ACTIVE" | "TRIALING" | "CANCELED" | "INACTIVE" | "PAST_DUE";
  plan: "MONTHLY" | "YEARLY" | null;
  currency: "USD" | "INR" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  statementDescriptor: string;
}

/**
 * Checks whether a household has active paid entitlement.
 * Enforces PRD: "Cancel anytime; access continues until the paid period ends."
 */
export async function getHouseholdEntitlement(
  householdId: string
): Promise<EntitlementStatus> {
  const subscription = await prisma.subscription.findUnique({
    where: { householdId },
  });

  if (!subscription) {
    return {
      isEntitled: false,
      status: "INACTIVE",
      plan: null,
      currency: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      statementDescriptor: STATEMENT_DESCRIPTOR,
    };
  }

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd;
  const isPeriodValid = periodEnd ? periodEnd.getTime() > now.getTime() : true;

  let isEntitled = false;

  if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
    if (subscription.cancelAtPeriodEnd) {
      isEntitled = isPeriodValid;
    } else {
      isEntitled = true;
    }
  } else if (subscription.status === "CANCELED") {
    // If canceled but period hasn't ended, user still retains access until period end
    isEntitled = isPeriodValid;
  }

  return {
    isEntitled,
    status: subscription.status as any,
    plan: (subscription.plan as any) || "MONTHLY",
    currency: (subscription.currency as any) || "USD",
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    statementDescriptor: STATEMENT_DESCRIPTOR,
  };
}

/**
 * Simple boolean check for gating paid features.
 */
export async function isHouseholdEntitled(householdId: string): Promise<boolean> {
  const entitlement = await getHouseholdEntitlement(householdId);
  return entitlement.isEntitled;
}
