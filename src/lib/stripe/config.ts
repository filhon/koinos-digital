export const SUBSCRIPTION_PLANS = {
  gratis: {
    priceId: "",
    limit: 100,
  },
  crescimento: {
    priceId: process.env.STRIPE_PRICE_ID_CRESCIMENTO,
    limit: 300,
  },
  igreja: {
    priceId: process.env.STRIPE_PRICE_ID_IGREJA,
    limit: 1000,
  },
  catedral: {
    priceId: process.env.STRIPE_PRICE_ID_CATEDRAL,
    limit: Infinity,
  },
};
