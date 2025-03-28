import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from 'react-hot-toast';

const SignUp = ({ specialOffer }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const createUserProfile = async (user, displayName = null) => {
    const userRef = doc(db, "bereavementlyUsers", user.uid);
    const userData = {
      name: displayName || name,
      email: user.email,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      subscriptionType: specialOffer ? "Premium" : "Free",
      requestNo: 0,
      ...(specialOffer && {
        subscription: {
          type: specialOffer.type,
          startDate: new Date(),
          endDate: new Date(Date.now() + (specialOffer.duration * 24 * 60 * 60 * 1000)),
          status: 'active',
          features: [
            'Unlimited AI grief counseling sessions',
            'Priority support access',
            'Personalized coping strategies',
            'Community support features',
            'Resource library access'
          ]
        }
      })
    };

    try {
      await setDoc(userRef, userData, { merge: true });
      // Also store subscription info in localStorage for quick access
      if (specialOffer) {
        localStorage.setItem('userSubscription', JSON.stringify({
          type: specialOffer.type,
          status: 'active',
          endDate: new Date(Date.now() + (specialOffer.duration * 24 * 60 * 60 * 1000)).toISOString()
        }));
      }
      // Store basic user info in localStorage
      localStorage.setItem('userProfile', JSON.stringify({
        name: displayName || name,
        email: user.email,
        subscriptionType: specialOffer ? "Premium" : "Free"
      }));
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Set persistence to LOCAL to persist the auth state
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await createUserProfile(user);
      
      // Store auth token in localStorage
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      
      toast.success('Account created successfully!');
      navigate("/profile");
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message.includes('auth/') ? 
        'Error creating account. Please try again.' : 
        err.message
      );
      toast.error('Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await createUserProfile(user, user.displayName);
      
      // Store auth token in localStorage
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      
      toast.success('Account created successfully!');
      navigate("/profile");
    } catch (err) {
      console.error('Google signup error:', err);
      setError(err.message.includes('auth/') ? 
        'Error signing up with Google. Please try again.' : 
        err.message
      );
      toast.error('Error signing up with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-16 sm:pt-20 flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600"
    >
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center mb-8">
          <Sparkles className="text-blue-200 mr-2" size={32} />
          <h2 className="text-4xl font-extrabold text-white">Join Us</h2>
        </div>

        {specialOffer && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm"
          >
            <h3 className="text-white text-lg font-semibold mb-2">Special Offer</h3>
            <p className="text-blue-100">
              {specialOffer.description}
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <User className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-300 text-sm bg-red-900 bg-opacity-20 p-3 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`w-full bg-blue-100 text-blue-800 py-3 rounded-full font-bold hover:bg-blue-200 transition duration-300 flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Creating Account...' : (
              <>
                Sign Up
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </motion.button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-blue-200 opacity-30 w-full"></div>
            <span className="bg-transparent px-4 text-blue-200 text-sm">or</span>
            <div className="border-t border-blue-200 opacity-30 w-full"></div>
          </div>

          <motion.button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`w-full bg-white bg-opacity-10 text-white py-3 rounded-full font-bold hover:bg-opacity-20 transition duration-300 flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </motion.button>
        </form>

        <div className="flex justify-center items-center mt-8 text-sm text-blue-100">
          <p className="mr-2">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="font-semibold hover:underline"
            disabled={isLoading}
          >
            Log In
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUp;