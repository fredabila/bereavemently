const stripe = require("stripe")(process.env.REACT_REACT_APP_STRIPE_SECRET_KEY);
const express = require("express");
const app = express();

app.use(express.json());

app.post("/api/check_subscription_status", async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    // Retrieve the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Session:", session);
    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    console.log("Subscription: ", subscription);
    // Map of Stripe Price IDs to your plan names
    const planMap = {
        price_1Q1F0oRxOeMixWFAZM6BhW2e: "Standard",
      price_1Q1F2ZRxOeMixWFAK4zUsgGe: "Premium",
      price_1Q1F4IRxOeMixWFAZQ555555: "Sponsor",
    };

    // Check the status of the subscription
    if (subscription.status !== "active") {
      // If the subscription is not active (e.g., canceled or past due), return the free plan
      return res.status(200).json({
        plan: "Free",
        subscriptionId: null,
        expiryDate: null,
      });
    }

    // If the subscription is active, return the plan, subscription ID, and expiry date
    res.status(200).json({
      plan: planMap[subscription.items.data[0].price.id] || "Free", // Default to Free if not mapped
      subscriptionId: subscription.id,
      expiryDate: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = app;
