import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center mb-8">
          <Sparkles className="text-blue-200 mr-2" size={32} />
          <h2 className="text-4xl font-extrabold text-white">Welcome Back</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-10 rounded-full placeholder-blue-200 text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-100 text-blue-800 py-3 rounded-full font-bold hover:bg-blue-200 transition duration-300 flex items-center justify-center"
          >
            Log In
            <ArrowRight className="ml-2" size={20} />
          </button>
        </form>

        <div className="flex justify-between items-center mt-8 text-sm text-blue-100">
          <button
            onClick={handleForgotPassword}
            className="hover:underline"
          >
            Forgot Password?
          </button>

          <button
            onClick={handleSignupRedirect}
            className="hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;