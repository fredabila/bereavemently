import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "bereavementlyUsers", user.uid), {
        name: name,
        email: user.email,
        subscriptionType: "Free",
        requestNo: 0,
      });

      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center mb-8">
          <Sparkles className="text-blue-200 mr-2" size={32} />
          <h2 className="text-4xl font-extrabold text-white">Join Us</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="relative">
            <User className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="relative">
            <Mail className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-3 left-3 text-blue-200" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password"
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-100 text-blue-800 py-3 rounded-full font-bold hover:bg-blue-200 transition duration-300 flex items-center justify-center"
          >
            Sign Up
            <ArrowRight className="ml-2" size={20} />
          </button>
        </form>

        <div className="flex justify-center items-center mt-8 text-sm text-blue-100">
          <p className="mr-2">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="font-semibold hover:underline"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;