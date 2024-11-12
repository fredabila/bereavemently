const stripe = require('stripe')(process.env.REACT_STRIPE_SECRET_KEY);
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/verify_subscription', async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    const planMap = {
      'price_1Q1F0oRxOeMixWFAZM6BhW2e': 'Standard',
      'price_1Q1F2ZRxOeMixWFAK4zUsgGe': 'Premium',
    };

    res.status(200).json({
      plan: planMap[subscription.items.data[0].price.id],
      subscriptionId: subscription.id,
      expiryDate: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = app;
