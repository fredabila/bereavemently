import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  MessageCircle,
  Crown,
  Shield,
  LogOut,
} from "lucide-react";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isOnChat = location.pathname === "/chat";
  const isOnProfile = location.pathname === "/profile";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 
          ${isScrolled 
            ? "bg-white shadow-lg" 
            : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/"
              className="flex items-center space-x-3 transition-transform duration-300 hover:scale-105"
            >
              <img
                src="https://i.ibb.co/b1c3tKS/Black-White-Minimalist-Business-Logo-removebg-preview.png"
                alt="Bereavemently Logo"
                className="h-8 w-auto sm:h-10"
              />
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  isScrolled ? "text-gray-800" : "text-white"
                }`}
              >
                Bereavemently
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavLinks
                user={user}
                isScrolled={isScrolled}
                currentPath={location.pathname}
                onLogout={handleLogout}
              />
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled 
                  ? "hover:bg-gray-100 text-gray-800" 
                  : "hover:bg-white/10 text-white"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-gray-200 shadow-lg"
            >
              <nav className="container mx-auto px-4 py-4 space-y-1">
                <NavLinks
                  user={user}
                  mobile
                  currentPath={location.pathname}
                  onLogout={handleLogout}
                  onItemClick={() => setIsMenuOpen(false)}
                />
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Add spacer to prevent content from being hidden under header */}
      <div className="h-16 sm:h-20"></div>
    </>
  );
};

const NavLinks = ({ user, mobile, isScrolled, currentPath, onLogout, onItemClick }) => {
  const baseClassName = `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
    ${mobile ? "w-full justify-start space-x-3" : "space-x-2"}`;

  const getItemClassName = (path) => {
    const isActive = currentPath === path;
    if (mobile) {
      return `${baseClassName} ${
        isActive
          ? "bg-indigo-500 text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`;
    }
    return `${baseClassName} ${
      isActive
        ? isScrolled
          ? "bg-indigo-500 text-white"
          : "bg-white/20 text-white"
        : isScrolled
        ? "text-gray-700 hover:bg-gray-100"
        : "text-white hover:bg-white/10"
    }`;
  };

  const navItems = user ? (
    <>
      <Link
        to="/chat"
        className={getItemClassName("/chat")}
        onClick={onItemClick}
      >
        <MessageCircle size={18} />
        <span>Chat</span>
      </Link>
      <Link
        to="/subscribe"
        className={getItemClassName("/subscribe")}
        onClick={onItemClick}
      >
        <Crown size={18} />
        <span>Subscribe</span>
      </Link>
      <Link
        to="/profile"
        className={getItemClassName("/profile")}
        onClick={onItemClick}
      >
        <User size={18} />
        <span>Profile</span>
      </Link>
      <button
        onClick={() => {
          onLogout();
          onItemClick?.();
        }}
        className={`${baseClassName} ${
          mobile
            ? "text-red-600 hover:bg-red-50"
            : isScrolled
            ? "text-gray-700 hover:bg-gray-100"
            : "text-white hover:bg-white/10"
        }`}
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>
    </>
  ) : (
    <>
      <Link
        to="/login"
        className={getItemClassName("/login")}
        onClick={onItemClick}
      >
        <LogIn size={18} />
        <span>Log In</span>
      </Link>
      <Link
        to="/signup"
        className={getItemClassName("/signup")}
        onClick={onItemClick}
      >
        <UserPlus size={18} />
        <span>Sign Up</span>
      </Link>
      <Link
        to="/privacy-policy"
        className={getItemClassName("/privacy-policy")}
        onClick={onItemClick}
      >
        <Shield size={18} />
        <span>Privacy</span>
      </Link>
    </>
  );

  return navItems;
};

export default Header;
