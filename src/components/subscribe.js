import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // Firestore and auth
import { doc, getDoc } from "firebase/firestore"; // Firestore functions

const plans = [
  {
    name: "Free",
    price: "$0/month",
    features: ["Access to basic chat", "5 requests per month", "Community support"],
  },
  {
    name: "Standard",
    price: "$9.99/month",
    features: ["Unlimited chat access", "20 requests per month", "Priority support"],
  },
  {
    name: "Premium",
    price: "$19.99/month",
    features: ["Unlimited chat access", "Unlimited requests", "24/7 premium support"],
  },
];

const Subscribe = () => {
  const [selectedPlan, setSelectedPlan] = useState(null); // Initial state is null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "bereavementlyUsers", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedPlan(userData.subscriptionType || "Free");
          console.log(userData.selectedPlan);
        }
      }
      setLoading(false);
    };

    fetchSubscription();
  }, []);

  const handleSelectPlan = (planName) => {
    setSelectedPlan(planName);
    // Logic for updating Firestore with selected plan can go here
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
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${
                selectedPlan === plan.name ? "ring-4 ring-blue-500" : "" // Highlighting the current plan with a blue ring
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
                onClick={() => handleSelectPlan(plan.name)}
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

      {/* FAQs Section */}
      <div className="max-w-4xl w-full mt-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800">What happens if I cancel my subscription?</h4>
            <p className="text-gray-600">
              If you cancel your subscription, you will be downgraded to the Free plan and lose access to premium features.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800">Can I switch between plans?</h4>
            <p className="text-gray-600">
              Yes, you can switch between plans at any time. The new plan will take effect immediately.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800">How do I upgrade my plan?</h4>
            <p className="text-gray-600">
              You can upgrade your plan by selecting a new plan from the options above. Your payment method will be charged accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
