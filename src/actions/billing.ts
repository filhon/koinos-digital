"use server";

import { stripe } from "@/lib/stripe/client";
import {
  getOrCreateStripeCustomer,
  isFeatureEnabled,
} from "@/lib/stripe/helpers";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import { getUser } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/permissions";
import { logAudit } from "./audit";
import { createClient } from "@/lib/supabase/server";

export async function createCheckoutSession(
  churchId: string,
  planKey: keyof typeof SUBSCRIPTION_PLANS
) {
  const user = await getUser();
  if (!user || user.church_id !== churchId) throw new Error("Unauthenticated");
  if (!checkPermission(user.role, "configuracoes", "update"))
    throw new Error("Unauthorized");

  const plan = SUBSCRIPTION_PLANS[planKey];
  if (!plan?.priceId) throw new Error("Invalid plan");

  const customerId = await getOrCreateStripeCustomer(
    churchId,
    user.email || ""
  );

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes/plano?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes/plano?canceled=true`,
    client_reference_id: churchId,
    metadata: {
      churchId,
    },
  });

  await logAudit({
    churchId: churchId,
    userId: user.id,
    action: "CREATE",
    entityType: "checkout_session",
    entityId: session.id,
    metadata: { planKey },
    ip: "server",
  });

  return { url: session.url };
}

export async function createBillingPortalSession(churchId: string) {
  const user = await getUser();
  if (!user || user.church_id !== churchId) throw new Error("Unauthenticated");
  if (!checkPermission(user.role, "configuracoes", "update"))
    throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("church_id", churchId)
    .single();

  if (!customer?.stripe_customer_id)
    throw new Error("No stripe customer found");

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracoes/plano`,
  });

  return { url: session.url };
}

export async function getSubscriptionStatus(churchId: string) {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("church_id", churchId)
    .single();

  return subscription;
}

export async function checkFeatureAccess(featureKey: string) {
  const user = await getUser();
  if (!user) return false;
  return isFeatureEnabled(user.parent_tenant_id || user.church_id, featureKey);
}
