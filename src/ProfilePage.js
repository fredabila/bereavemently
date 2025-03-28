import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShare, faEdit, faCopy, faDownload, 
  faUser, faCalendar, faBell, faHeart,
  faChartLine, faCog, faShield, faSpinner,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 10;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  border-radius: 20px;
  padding: 3rem 2rem;
  color: white;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
`;

const ShareableCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  position: relative;
`;

const StatsCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
  }
`;

const EditProfileModal = ({ editForm, setEditForm, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-indigo-500 focus:border-indigo-500 h-32 resize-none"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Preferences
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={editForm.preferences.emailNotifications}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    preferences: {
                      ...editForm.preferences,
                      emailNotifications: e.target.checked
                    }
                  })}
                  className="toggle toggle-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Session Reminders</span>
                <input
                  type="checkbox"
                  checked={editForm.preferences.sessionReminders}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    preferences: {
                      ...editForm.preferences,
                      sessionReminders: e.target.checked
                    }
                  })}
                  className="toggle toggle-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                     transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [profileData, setProfileData] = useState({
    joinDate: null,
    sessionsCount: 0,
    journalEntries: 0,
    lastActive: null,
    preferences: {},
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    preferences: {},
  });

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "bereavementlyUsers", user.uid));
      if (userDoc.exists()) {
        setProfileData(userDoc.data());
        setEditForm({
          displayName: user.displayName || '',
          bio: userDoc.data().bio || '',
          preferences: userDoc.data().preferences || {},
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile data");
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error("Failed to sign out");
    }
  };

  const generateShareableCard = async () => {
    setIsGeneratingCard(true);
    try {
      // Pre-load the logo
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = "https://i.ibb.co/b1c3tKS/Black-White-Minimalist-Business-Logo-removebg-preview.png";
      });

      const card = document.getElementById('shareableCard');
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'bereavemently-profile.png';
      link.click();
      
      toast.success("Profile card downloaded successfully!");
    } catch (error) {
      console.error("Error generating card:", error);
      toast.error("Failed to generate profile card");
    }
    setIsGeneratingCard(false);
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user.uid}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const handlePreferenceChange = (key, value) => {
    setProfileData((prevData) => ({
      ...prevData,
      preferences: {
        ...prevData.preferences,
        [key]: value,
      },
    }));
  };

  const handlePrivacyChange = (e) => {
    setProfileData((prevData) => ({
      ...prevData,
      privacy: e.target.value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, "bereavementlyUsers", user.uid), {
        displayName: editForm.displayName,
        bio: editForm.bio,
        preferences: editForm.preferences,
      });
      
      setProfileData((prevData) => ({
        ...prevData,
        displayName: editForm.displayName,
        bio: editForm.bio,
        preferences: editForm.preferences,
      }));
      
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Please log in to view your profile</h2>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfileContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProfileHeader>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome, {user.displayName || 'Friend'}
              </h1>
              <p className="text-indigo-100">{user.email}</p>
              {profileData.bio && (
                <p className="text-indigo-100 mt-2">{profileData.bio}</p>
              )}
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </ProfileHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500">Total Sessions</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {profileData.sessionsCount || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FontAwesomeIcon icon={faChartLine} className="text-indigo-600" />
              </div>
            </div>
          </StatsCard>

          <StatsCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500">Journal Entries</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {profileData.journalEntries || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FontAwesomeIcon icon={faHeart} className="text-indigo-600" />
              </div>
            </div>
          </StatsCard>

          <StatsCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500">Member Since</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FontAwesomeIcon icon={faCalendar} className="text-indigo-600" />
              </div>
            </div>
          </StatsCard>
        </div>

        {/* Shareable Card */}
        <ShareableCard id="shareableCard" className="bg-gradient-to-br from-white to-indigo-50">
          <div className="flex items-center justify-between mb-6">
            <img 
              src="https://i.ibb.co/b1c3tKS/Black-White-Minimalist-Business-Logo-removebg-preview.png" 
              alt="Bereavemently Logo" 
              className="w-32"
              crossOrigin="anonymous"
            />
            <div className="text-right">
              <h3 className="text-xl font-semibold text-indigo-600">I am a Bereavemently user</h3>
              <p className="text-gray-500">Finding strength in connection</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={copyProfileLink}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Copy Profile Link"
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button
              onClick={generateShareableCard}
              disabled={isGeneratingCard}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Download Profile Card"
            >
              <FontAwesomeIcon icon={isGeneratingCard ? faSpinner : faDownload} 
                              className={isGeneratingCard ? 'animate-spin' : ''} />
            </button>
          </div>
        </ShareableCard>

        {/* Settings Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Notifications</h3>
              <div className="space-y-2">
                {Object.entries(profileData.preferences || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-gray-600">{key}</label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                      className="toggle toggle-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Privacy</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Visibility</span>
                  <select
                    className="border rounded-md px-3 py-1"
                    value={profileData.privacy || 'private'}
                    onChange={handlePrivacyChange}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <EditProfileModal
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveProfile}
        />
      )}
    </ProfileContainer>
  );
};

export default ProfilePage;