import { stripe } from "./client";
import { createAdminClient } from "../supabase/admin";

export async function getOrCreateStripeCustomer(
  churchId: string,
  email: string
) {
  const supabase = createAdminClient();

  const { data: existingCustomer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("church_id", churchId)
    .single();

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  const { data: church } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", churchId)
    .single();

  const customer = await stripe.customers.create({
    email,
    name: church?.name || "Igreja",
    metadata: {
      churchId,
    },
  });

  await supabase.from("stripe_customers").insert({
    church_id: churchId,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}

export async function syncSubscriptionFromStripe(stripeSubscriptionId: string) {
  const supabase = createAdminClient();

  const subscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const customerId = subscription.customer as string;

  const { data: customerRecord } = await supabase
    .from("stripe_customers")
    .select("church_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!customerRecord) {
    throw new Error("Customer not found in local DB");
  }

  const planKey =
    Object.entries(process.env)
      .find(
        ([key, val]) =>
          val === subscription.items.data[0].price.id &&
          key.startsWith("STRIPE_PRICE_ID_")
      )?.[0]
      .replace("STRIPE_PRICE_ID_", "")
      .toLowerCase() || "gratis";

  const data = {
    church_id: customerRecord.church_id,
    stripe_subscription_id: subscription.id,
    plan: planKey,
    status: subscription.status,
    current_period_start: new Date(
      subscription.items.data[0].current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.items.data[0].current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  await supabase
    .from("subscriptions")
    .upsert(data, { onConflict: "stripe_subscription_id" });

  await supabase
    .from("tenants")
    .update({ plan: planKey })
    .eq("id", customerRecord.church_id);
}

export async function isFeatureEnabled(churchId: string, featureKey: string) {
  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", churchId)
    .single();

  const plan = tenant?.plan || "gratis";

  const { data: featureFlag } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("plan", plan)
    .eq("feature_key", featureKey)
    .single();

  return featureFlag?.enabled ?? false;
}
