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
import CAFireQRCode from './components/CAFireQRCode';
import "./index.css";

// Maintenance Screen Component
const MaintenanceScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-6"></div>
        </div>
        
        <div className="space-y-6">
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            We're using all of the feedback we received from our first 1,800 visitors to bring you the best version possible.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              We'll see you soon!
            </p>
            <p className="text-gray-600">
              Thank you for your patience while we make Bereavemently even better for you.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Updates in progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const user = auth.currentUser;
  const [showChat, setShowChat] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(true); // Set to true for maintenance mode

  // If maintenance mode is enabled, show maintenance screen
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

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
            <Route path="/ca-fire-support" element={
              <Signup specialOffer={{
                type: 'CA_FIRE_VICTIM',
                duration: 90,
                description: 'Free 90-day Premium Support for California Fire Victims'
              }} />
            } />
            <Route path="/ca-fire-qr" element={<CAFireQRCode />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
