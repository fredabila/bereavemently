import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, CreditCard, LogOut } from 'lucide-react';

const UserProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // Placeholder function for handling subscription upgrades
  const handleUpgrade = () => {
    navigate('/subscribe');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden md:max-w-2xl transform hover:scale-105 transition duration-300">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img className="h-48 w-full object-cover md:w-48" src={user.photoURL || 'https://forcecancercharity.co.uk/wp-content/uploads/2021/04/Bereavement-scaled-768x470.jpg'} alt={user.displayName} />
          </div>
          <div className="p-8 w-full">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">Your Profile</div>
            <h1 className="block mt-1 text-lg leading-tight font-medium text-black">{user.displayName}</h1>
            <p className="mt-2 text-gray-500 flex items-center">
              <User className="mr-2" size={18} />
              {user.username || 'Username not set'}
            </p>
            <p className="mt-2 text-gray-500 flex items-center">
              <Mail className="mr-2" size={18} />
              {user.email}
            </p>
            <p className="mt-2 text-gray-500 flex items-center">
              <CreditCard className="mr-2" size={18} />
              Current Plan: <span className="ml-1 font-semibold">{user.subscriptionPlan || 'Free'}</span>
            </p>
            
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleUpgrade}
                className="bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 text-white py-2 px-4 rounded-full hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition duration-300"
              >
                Upgrade Plan
              </button>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-red-500 transition duration-300"
              >
                <LogOut className="mr-1" size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;