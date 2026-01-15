// src/pages/Profile.jsx

import { useState } from 'react';
import { User, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.data);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authService.updatePassword(passwordData);
      setMessage('Password updated successfully!');
      setPasswordData({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      setLoading(true);
      await authService.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile Settings</h1>

      <div className="profile-container">
        <div className="profile-sidebar">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            <span>Password</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <Trash2 size={20} />
            <span>Danger Zone</span>
          </button>
        </div>

        <div className="profile-content">
          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="card-title">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="input"
                    value={user?.email || ''}
                    disabled
                  />
                  <small className="form-text">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Account Type</label>
                  <input
                    type="text"
                    className="input"
                    value={user?.provider || 'local'}
                    disabled
                  />
                </div>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <h2 className="card-title">Change Password</h2>
              {user?.provider === 'google' ? (
                <div className="info-message">
                  <p>You are signed in with Google. Password changes are not available for Google accounts.</p>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      className="input"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                    <small className="form-text">Minimum 6 characters</small>
                  </div>

                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card danger-zone">
              <h2 className="card-title">Danger Zone</h2>
              <div className="danger-content">
                <div>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button
                  className="button button-danger"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;