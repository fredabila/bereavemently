import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { loadStripe } from "@stripe/stripe-js";

// Replace with your Stripe publishable key
const stripePromise = loadStripe("pk_live_51Q18EeRxOeMixWFA70jzKP4IPMuXEG3Mn3MAEqFSUqWI8yAkSi1V0rqtU9QZWvmy5de5mWITt6rwVn3Z1lFT69Qg00bRViaV1Z");

const plans = [
  {
    name: "Free",
    price: "$0/month",
    features: ["Access to basic chat", "5 requests per month", "Community support"],
    priceId: null, // Free plan doesn't need a Stripe Price ID
  },
  {
    name: "Standard",
    price: "$9.99/month",
    features: ["Unlimited chat access", "20 requests per month", "Priority support"],
    priceId: "price_1Q18kJRxOeMixWFASwaQKkn2", // Replace with actual Stripe Price ID
  },
  {
    name: "Premium",
    price: "$19.99/month",
    features: ["Unlimited chat access", "Unlimited requests", "24/7 premium support"],
    priceId: "price_premium_id_from_stripe", // Replace with actual Stripe Price ID
  },
];

const Subscribe = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "bereavementlyUsers", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedPlan(userData.subscriptionType || "Free");
          setSubscriptionExpiry(userData.subscriptionExpiry?.toDate() || null);
        }
      }
      setLoading(false);
    };

    fetchSubscription();
  }, []);

  const handleSelectPlan = async (plan) => {
    if (plan.name === "Free") {
      setSelectedPlan("Free");
      // Update user's plan to Free in Firestore
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "bereavementlyUsers", user.uid);
        await updateDoc(userDocRef, {
          subscriptionType: "Free",
          subscriptionId: null,
          subscriptionExpiry: null,
        });
      }
    } else {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: plan.priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/subscribe`,
        customerEmail: auth.currentUser?.email,
      });

      if (error) {
        console.error('Error:', error);
        // Handle any errors that occur during the redirect
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Choose Your Plan</h2>
        <p className="text-center text-lg text-gray-600">
          Select a plan that best suits your needs. Your current plan is <span className="font-semibold">{selectedPlan}</span>.
          {subscriptionExpiry && (
            <span className="block mt-2">
              Subscription expires on: {subscriptionExpiry.toLocaleDateString()}
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${
                selectedPlan === plan.name ? "ring-4 ring-blue-500" : ""
              }`}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{plan.name}</h3>
              <p className="text-lg text-gray-600 mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-500">
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-2 px-4 rounded-lg text-white font-bold transition ${
                  selectedPlan === plan.name ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {selectedPlan === plan.name ? "Current Plan" : "Select Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section (unchanged) */}
    </div>
  );
};

export default Subscribe;