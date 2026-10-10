import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: any;

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // Direct JSON parsing for development / testing mode
      try {
        const parsed = JSON.parse(rawBody);
        event = parsed.event || parsed;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    const eventType = event.type;
    console.log(`Processing billing webhook event: ${eventType}`);

    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const householdId =
          session.metadata?.householdId ||
          session.client_reference_id ||
          session.customer_details?.metadata?.householdId;

        if (!householdId) {
          console.warn("Webhook checkout.session.completed missing householdId");
          break;
        }

        const plan = session.metadata?.plan === "YEARLY" ? "YEARLY" : "MONTHLY";
        const region = session.metadata?.region || "US";
        const currency = region === "IN" ? "INR" : "USD";

        const periodDays = plan === "YEARLY" ? 365 : 30;
        const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

        await prisma.subscription.upsert({
          where: { householdId },
          update: {
            stripeCustomerId: (session.customer as string) || `cus_${householdId.substring(0, 8)}`,
            stripeSubscriptionId:
              (session.subscription as string) || `sub_${householdId.substring(0, 8)}`,
            status: "ACTIVE",
            plan,
            currency,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
          create: {
            householdId,
            stripeCustomerId: (session.customer as string) || `cus_${householdId.substring(0, 8)}`,
            stripeSubscriptionId:
              (session.subscription as string) || `sub_${householdId.substring(0, 8)}`,
            status: "ACTIVE",
            plan,
            currency,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const subscriptionId = sub.id;
        const status = sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : "CANCELED";
        const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined;

        const householdId = sub.metadata?.householdId;

        if (householdId) {
          await prisma.subscription.updateMany({
            where: { householdId },
            data: {
              status,
              cancelAtPeriodEnd,
              ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
            },
          });
        } else if (subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status,
              cancelAtPeriodEnd,
              ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const subscriptionId = sub.id;
        const householdId = sub.metadata?.householdId;

        if (householdId) {
          await prisma.subscription.updateMany({
            where: { householdId },
            data: { status: "CANCELED" },
          });
        } else if (subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: "CANCELED" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error?.message || "Webhook error" }, { status: 500 });
  }
}
