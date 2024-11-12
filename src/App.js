import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./firebase";
import Header from "./components/header";
import LandingPage from "./LandingPage";
import Chat from "./Chat";
import Login from "./components/login";
import Signup from "./components/signup";
import ProtectedRoute from "./components/privateroute";
import Subscribe from "./components/subscribe";
import ProfilePage from "./ProfilePage";
import PrivacyPolicy from "./components/privacy_policy";
import "./index.css";

function App() {
  const user = auth.currentUser;
  const [showChat, setShowChat] = useState(false);

  return (
    <Router>
      <div className="font-sans bg-gray-100 min-h-screen flex flex-col">
        <Header user={user} />
        <main>
          <Routes>
            <Route
              path="/"
              element={<LandingPage onStartChat={() => setShowChat(true)} />}
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/subscribe"
              element={
                <ProtectedRoute>
                  <Subscribe />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
