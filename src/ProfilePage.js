import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase'; // Adjust the import path as needed
import UserProfile from './components/UserProfile'; // Adjust the import path as needed

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser; 
  console.log(user);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (!user) {
    // Handle the case where there's no logged-in user
    return <div>Please log in to view your profile.</div>;
  }

  return <UserProfile user={user} onLogout={handleLogout} />;
};

export default ProfilePage;