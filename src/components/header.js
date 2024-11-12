import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  MessageCircle,
  Crown,
} from "lucide-react";
import { auth } from "../firebase";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null); // State to hold the user object

  useEffect(() => {
    // Listen for changes in authentication state
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      console.log(currentUser); // This will log the user object or null
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="https://i.ibb.co/b1c3tKS/Black-White-Minimalist-Business-Logo-removebg-preview.png"
              alt="Bereavemently Logo"
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold tracking-tight">
              Bereavemently
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLinks user={user} />
          </nav>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-4 pt-2 pb-4 space-y-2">
            <NavLinks user={user} mobile />
          </nav>
        </div>
      )}
    </header>
  );
};

const NavLinks = ({ user, mobile }) => {
  const linkClass = `flex items-center space-x-2 ${
    mobile ? "text-lg py-2" : "hover:text-indigo-200 transition-colors"
  }`;

  return (
    <>
      {user ? (
        <>
          <Link to="/chat" className={linkClass}>
            <MessageCircle size={20} />
            <span>Chat</span>
          </Link>
          <Link to="/subscribe" className={linkClass}>
            <Crown size={20} />
            <span>Subscribe</span>
          </Link>
          <Link to="/profile" className={linkClass}>
            <User size={20} />
            <span>Profile</span>
          </Link>
        </>
      ) : (
        <>
          <Link to="/login" className={linkClass}>
            <LogIn size={20} />
            <span>Login</span>
          </Link>
          <Link to="/signup" className={linkClass}>
            <UserPlus size={20} />
            <span>Sign Up</span>
          </Link>
          <Link to="/privacy_policy" className={linkClass}>
            <span>Privacy Policy</span>
          </Link>
        </>
      )}
    </>
  );
};

export default Header;
