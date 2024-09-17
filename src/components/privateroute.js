import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "bereavementlyUsers", user.uid));
        if (userDoc.exists()) {
          // All users (free, standard, premium) can access the chat
          setIsAllowed(true);
        } else {
          navigate("/login"); // Redirect to login if not authenticated
        }
      } else {
        navigate("/login"); // Redirect to login if not authenticated
      }
      setLoading(false);
    };
    checkSubscription();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-lg font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAllowed ? children : null;
};

export default ProtectedRoute;
