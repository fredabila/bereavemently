require('dotenv').config(); // To load environment variables from .env
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

// Your Stripe subscription verification route
app.post('/api/check_subscription_status', async (req, res) => {
    const { session_id } = req.body;
  
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
  
    try {
      // Retrieve the session details from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      // Retrieve the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
      // Map of Stripe Price IDs to your plan names
      const planMap = {
        'price_1Q1AKlRxOeMixWFAPPlANHx9': 'Standard',
        'price_premium_id_from_stripe': 'Premium',
      };
  
      // Check the status of the subscription
      if (subscription.status !== 'active') {
        // If the subscription is not active (e.g., canceled or past due), return the free plan
        return res.status(200).json({
          plan: 'Free',
          subscriptionId: null,
          expiryDate: null,
        });
      }
  
      // If the subscription is active, return the plan, subscription ID, and expiry date
      res.status(200).json({
        plan: planMap[subscription.items.data[0].price.id] || 'Free', // Default to Free if not mapped
        subscriptionId: subscription.id,
        expiryDate: new Date(subscription.current_period_end * 1000).toISOString(),
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

// Default route for all other methods
app.all('*', (req, res) => {
  res.status(405).send('Method Not Allowed');
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
