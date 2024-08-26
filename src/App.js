import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Chat from './Chat';
import './index.css';


function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {showChat ? <Chat /> : <LandingPage onStartChat={() => setShowChat(true)} />}
    </div>
  );
}

export default App;
