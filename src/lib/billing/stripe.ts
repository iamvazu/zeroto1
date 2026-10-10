import Stripe from "stripe";
import { getRegionPricing, Region } from "../region";

export const STATEMENT_DESCRIPTOR = "ZEROTO1";

const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_zeroto1_key";

export const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2025-02-24.acacia" as any,
  typescript: true,
});

export interface CheckoutOptions {
  householdId: string;
  email: string;
  plan: "MONTHLY" | "YEARLY";
  region: Region;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
  mode: "live" | "test_mock";
}

/**
 * Creates a Stripe checkout session for a household.
 * Supports both test mode Stripe API and seamless local dev simulation.
 */
export async function createBillingCheckoutSession(
  options: CheckoutOptions
): Promise<CheckoutResult> {
  const { householdId, email, plan, region, successUrl, cancelUrl } = options;
  const pricing = getRegionPricing(region);
  const isYearly = plan === "YEARLY";
  const amount = isYearly ? pricing.yearlyAmount : pricing.monthlyAmount;
  const currency = pricing.currency.toLowerCase();
  const unitAmountInCents = Math.round(amount * 100);

  const productName = `Zeroto1 Academy Household Plan (${isYearly ? "Annual" : "Monthly"})`;

  // Check if live or test key is set
  const isRealKey = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("mock");

  if (isRealKey) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: email,
        client_reference_id: householdId,
        metadata: {
          householdId,
          plan,
          region,
          statementDescriptor: STATEMENT_DESCRIPTOR,
        },
        subscription_data: {
          description: `Zeroto1 Academy Household Plan - ${STATEMENT_DESCRIPTOR}`,
          metadata: {
            householdId,
            plan,
            region,
            statementDescriptor: STATEMENT_DESCRIPTOR,
          },
        },
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: productName,
                description: "Full household access: all subjects, 1,500+ lessons, practice labs & AI lessons.",
                statement_descriptor: STATEMENT_DESCRIPTOR,
              },
              unit_amount: unitAmountInCents,
              recurring: {
                interval: isYearly ? "year" : "month",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      return {
        sessionId: session.id,
        url: session.url || successUrl,
        mode: "live",
      };
    } catch (err) {
      console.warn("Stripe API call failed, falling back to simulated session:", err);
    }
  }

  // Simulated test checkout session
  const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const simulatedUrl = `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id=${mockSessionId}&simulated=true`;

  return {
    sessionId: mockSessionId,
    url: simulatedUrl,
    mode: "test_mock",
  };
}
