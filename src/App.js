import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components'; // Import styled here
import LandingPage from './LandingPage';
import Chat from './Chat';
import './index.css';

const SideMenu = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 250px; 
  background-color: #1e1e2e; 
  color: white;
  padding-top: 60px; // Adjust for header height
  z-index: 100; 
  transform: translateX(${({ isOpen }) => isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease-in-out; 

  @media (min-width: 768px) {
    display: none; // Hide on larger screens
  }
`;

const MenuLink = styled(motion.a)`
  display: block;
  padding: 15px 20px;
  color: #fff;
  text-decoration: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #333344;
  }
`;

function App() {
  const [showChat, setShowChat] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="font-sans">
      <header className="bg-blue-500 text-white fixed w-full z-50 top-0 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
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

          {/* Navigation for larger screens (hidden on mobile) */}
          <nav className="hidden md:block"> 
            {/* ... your desktop navigation links  */}
          </nav>
        </div>
      </header>

      {/* Side Navigation Drawer for Mobile */}
      <SideMenu isOpen={isNavOpen} 
        initial={{ opacity: 0 }} 
        animate={{ opacity: isNavOpen ? 1 : 0 }} 
      >
        <MenuLink href="#home" onClick={() => setIsNavOpen(false)}>Home</MenuLink>
        <MenuLink href="#about" onClick={() => setIsNavOpen(false)}>About</MenuLink>
        {/* ... add other menu items */}
        <MenuLink as={motion.button} 
          onClick={() => { setShowChat(true); setIsNavOpen(false); }}
          whileHover={{ backgroundColor: '#5a5abf' }} // Example hover effect
        >
          Start Chat
        </MenuLink>
      </SideMenu>

      {/* Main Content */}
      <main className="pt-16 md:pt-20"> 
        {showChat ? <Chat /> : <LandingPage onStartChat={() => setShowChat(true)} />}
      </main>
    </div>
  );
}

export default App;