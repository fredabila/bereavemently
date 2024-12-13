import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { loadStripe } from "@stripe/stripe-js";
import Confetti from "react-confetti"; // Install this package for confetti effect

// Replace with your Stripe publishable key
const stripePromise = loadStripe(
  "pk_live_51Q18EeRxOeMixWFA70jzKP4IPMuXEG3Mn3MAEqFSUqWI8yAkSi1V0rqtU9QZWvmy5de5mWITt6rwVn3Z1lFT69Qg00bRViaV1Z"
);

const plans = [
  {
    name: "Free",
    price: "$0/month",
    features: [
      "Access to basic chat",
      "50 requests daily",
      "Community support",
    ],
    priceId: null, // Free plan doesn't need a Stripe Price ID
  },
  {
    name: "Standard",
    price: "$4.99/month",
    features: [
      "Unlimited chat access",
      "250 requests daily",
      "Priority support",
      "Access to Microphone"
    ],
    priceId: "price_1Q1F0oRxOeMixWFAZM6BhW2e", // Replace with actual Stripe Price ID
  },
  {
    name: "Premium",
    price: "$9.99/month",
    features: [
      "Unlimited chat access",
      "Unlimited requests",
      "24/7 premium support",
      "Access to Microphone"
    ],
    priceId: "price_1Q1F2ZRxOeMixWFAK4zUsgGe", // Replace with actual Stripe Price ID
  },
  {
    name: "Sponsor",
    price: "$75/week",
    features: ["Unlimited chat access", "Unlimited requests", "24/7 premium support", "Access to Microphone"],
    priceId: "price_1QVeFSRxOeMixWFAJST2LF8H", // Replace with actual Stripe Price ID
  },  
];

const Subscribe = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false); // Add success state

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

          if (userData.subscriptionId) {
            await checkSubscriptionStatus(
              userData.subscriptionSession,
              userData.subscriptionId
            );
          }
        }
      }
      setLoading(false);
    };

    fetchSubscription();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      const session_id = query.get("session_id");
      handleSuccessfulSubscription(session_id);
    }
  }, []);

  const handleSuccessfulSubscription = async (session_id) => {
    try {
      const response = await fetch("/api/verify_subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id }),
      });

      if (response.ok) {
        const subscriptionData = await response.json();
        const user = auth.currentUser;

        if (user) {
          const userDocRef = doc(db, "bereavementlyUsers", user.uid);

          await updateDoc(userDocRef, {
            subscriptionType: subscriptionData.plan,
            subscriptionId: subscriptionData.subscriptionId,
            subscriptionExpiry: new Date(subscriptionData.expiryDate),
            subscriptionSession: session_id,
          });

          setSelectedPlan(subscriptionData.plan);
          setSubscriptionExpiry(new Date(subscriptionData.expiryDate));
          setIsSuccess(true); // Set success to true
        }
      } else {
        console.error("Failed to verify subscription.");
      }
    } catch (error) {
      console.error("Error during subscription handling:", error);
    }
  };

  const handleTogglePlan = async (name) => {
    const user = auth.currentUser;
    const userDocRef = doc(db, "bereavementlyUsers", user.uid);

    await updateDoc(userDocRef, {
      subscriptionType: name,
    });
    setSelectedPlan(name);
  };

  const checkSubscriptionStatus = async (sessionId) => {
    try {
      const response = await fetch("/api/check_subscription_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const result = await response.json();
      console.log(result);
      if (result.plan !== "Free") {
        await handleTogglePlan(result.plan);
      } else {
        await handleTogglePlan("Free");
      }
    } catch (error) {
      console.error("Failed to check subscription status:", error);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (plan.name === "Free") {
    } else {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: plan.priceId, quantity: 1 }],
        mode: "subscription",
        successUrl: `${window.location.origin}/subscribe?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscribe`,
        customerEmail: auth.currentUser?.email,
      });

      if (error) {
        console.error("Error:", error);
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Glamorous success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Confetti /> {/* Confetti effect */}
        <h1 className="text-4xl font-extrabold text-white mb-6">🎉 Success!</h1>
        <p className="text-xl text-white mb-4">
          You've successfully subscribed to the{" "}
          <span className="font-bold">{selectedPlan}</span> plan!
        </p>
        <p className="text-lg text-white mb-4">
          Subscription Expires on: {subscriptionExpiry?.toLocaleDateString()}
        </p>
        <button
          className="py-3 px-6 rounded-lg bg-white text-purple-700 font-bold transition hover:bg-purple-100"
          onClick={() => setIsSuccess(false)}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Choose Your Plan
        </h2>
        <p className="text-center text-lg text-gray-600">
          Select a plan that best suits your needs. Your current plan is{" "}
          <span className="font-semibold">{selectedPlan}</span>.
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
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {plan.name}
              </h3>
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
                  selectedPlan === plan.name
                    ? "bg-blue-500"
                    : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {selectedPlan === plan.name ? "Current Plan" : "Select Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
