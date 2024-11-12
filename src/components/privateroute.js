import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth"; // Import the auth listener

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true); // Loading state to manage waiting for auth state
  const [isAllowed, setIsAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, "bereavementlyUsers", user.uid));
          if (userDoc.exists()) {
            // All users (free, standard, premium) can access the chat
            setIsAllowed(true);
          } else {
            navigate("/login"); // Redirect if no subscription data is found
          }
        } else {
          navigate("/login"); // Redirect to login if no user
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    // Listen to auth state changes and fetch user subscription accordingly
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkSubscription(user);
      } else {
        setLoading(false); // No user found, stop loading
        navigate("/login"); // Redirect to login if user is not logged in
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    // Show a loading spinner while checking the user's auth state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children only if allowed, otherwise null
  return isAllowed ? children : null;
};

export default ProtectedRoute;
