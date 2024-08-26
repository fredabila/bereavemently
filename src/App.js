import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LandingPage from './LandingPage';
import Chat from './Chat';
import './index.css';

function App() {
  const [showChat, setShowChat] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); 

  return (
    <div className="font-sans"> 
      <header className="bg-blue-500 text-white fixed w-full z-50 top-0 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
          {/* Logo/Brand */}
          <a href="/" className="text-xl md:text-2xl font-bold">
            Bereavemently
          </a>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              {isNavOpen ? (
                <path d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.829-4.828-4.828-4.828a1 1 0 0 1 1.414-1.414l4.828 4.829 4.829-4.829a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.829 4.828z" />
              ) : (
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              )}
            </svg>
          </button>

          {/* Navigation Links */}
          <nav className={`${isNavOpen ? 'block' : 'hidden'} md:block`}>
            <ul className="md:flex space-x-4 md:space-x-6 lg:space-x-8">
              <li>
                <a href="#home" className="block py-2 hover:text-gray-300 transition duration-300">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="block py-2 hover:text-gray-300 transition duration-300">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="block py-2 hover:text-gray-300 transition duration-300">
                  Services
                </a>
              </li>
              <li>
                <a href="#contact" className="block py-2 hover:text-gray-300 transition duration-300">
                  Contact
                </a>
              </li>
              <li>
                <motion.button 
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 rounded-md text-blue-500 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Chat
                </motion.button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content (adjust top padding for fixed header) */}
      <main className="pt-10 md:pt-20"> 
        {showChat ? <Chat /> : <LandingPage onStartChat={() => setShowChat(true)} />}
      </main>
    </div>
  );
}

export default App;