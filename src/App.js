import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Chat from './Chat';
import './index.css';

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {/* Header / Navigation Bar */}
      <header className="bg-blue-500 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Bereavemently</div>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#home" className="hover:text-gray-300">Home</a></li>
              <li><a href="#about" className="hover:text-gray-300">About</a></li>
              <li><a href="#services" className="hover:text-gray-300">Services</a></li>
              <li><a href="#contact" className="hover:text-gray-300">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mt-4">
        {showChat ? <Chat /> : <LandingPage onStartChat={() => setShowChat(true)} />}
      </div>
    </div>
  );
}

export default App;
