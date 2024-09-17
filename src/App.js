import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./firebase";
import LandingPage from "./LandingPage";
import Chat from "./Chat";
import Login from "./components/login";
import Signup from "./components/signup";
import ProtectedRoute from "./components/privateroute";
import Subscribe from "./components/subscribe";
import "./index.css";

function App() {
  const [showChat, setShowChat] = useState(false);
  const user = auth.currentUser;
  return (
    <Router>
      <div className="font-sans">
        <header className="bg-blue-500 text-white fixed w-full z-50 top-0 shadow-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
            <a href="/" className="text-xl md:text-2xl font-bold">
              Bereavemently
            </a>
          </div>
        </header>

        <main className="pt-16 md:pt-20">
          <Routes>
            <Route
              path="/"
              element={<LandingPage onStartChat={() => setShowChat(true)} />}
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat user={user}/>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/subscribe" element={<Subscribe />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
