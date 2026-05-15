import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { syncSubscriptionFromStripe } from "@/lib/stripe/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    return new Response(`Webhook Error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  try {
    const { data: existingEvent } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      return new Response("Event already processed", { status: 200 });
    }

    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      type: event.type,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          await syncSubscriptionFromStripe(session.subscription as string);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripe(subscription.id);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          if (sub.customer) {
            const customer = await stripe.customers.retrieve(
              sub.customer as string
            );
            if (!customer.deleted && customer.email) {
              await sendEmail({
                to: customer.email,
                subject: "Falha no pagamento da assinatura",
                template: "payment-failed",
                data: {
                  churchName: customer.name || "sua igreja",
                  managePlanUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes/plano`,
                },
              });
            }
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (invoice.subscription) {
          await syncSubscriptionFromStripe(invoice.subscription as string);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (err: unknown) {
    console.error("Stripe webhook error:", err);
    await supabase.from("audit_logs").insert({
      action: "STRIPE_WEBHOOK_ERROR",
      entity_type: "system",
      metadata: { error: "Webhook processing failed" },
      ip: "stripe_webhook",
    });
    return new Response(null, { status: 200 });
  }
}
