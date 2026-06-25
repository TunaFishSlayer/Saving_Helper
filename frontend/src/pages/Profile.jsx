// src/pages/Profile.jsx

import { useState } from 'react';
import { User, Lock, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.data);
      setMessage(t('profileUpdatedSuccess'));
    } catch (err) {
      setError(err.message || t('profileUpdatedError'));
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
      setMessage(t('passwordUpdatedSuccess'));
      setPasswordData({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.message || t('passwordUpdatedError'));
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setDeleteStep(1);
  };

  const proceedDeleteAccount = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      try {
        setLoading(true);
        await authService.deleteAccount();
        closeDeleteConfirmModal();
        logout();
        navigate('/login');
      } catch (err) {
        setError(err.message || t('deleteAccountError'));
        setLoading(false);
        setDeleteStep(1);
      }
    }
  };

  return (
    <div className="profile-page">
      <h1 className="page-title">{t('profileTitle')}</h1>

      <div className="profile-container">
        <div className="profile-sidebar">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>{t('profileTabName')}</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            <span>{t('passwordTabName')}</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <Trash2 size={20} />
            <span>{t('dangerTabName')}</span>
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
              <h2 className="card-title">{t('profileInfoTitle')}</h2>
              <form onSubmit={handleUpdateProfile} className="form">
                <div className="form-group">
                  <label>{t('emailLabel')}</label>
                  <input
                    type="email"
                    className="input"
                    value={user?.email || ''}
                    disabled
                  />
                  <small className="form-text">{t('emailCantChange')}</small>
                </div>

                <div className="form-group">
                  <label>{t('nameLabel')}</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('accountTypeLabel')}</label>
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
                  {loading ? t('updatingBtn') : t('updateProfileBtn')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <h2 className="card-title">{t('changePasswordTitle')}</h2>
              {user?.provider === 'google' ? (
                <div className="info-message">
                  <p>{t('googleInfoText')}</p>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="form">
                  <div className="form-group">
                    <label>{t('currentPasswordLabel')}</label>
                    <input
                      type="password"
                      className="input"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('newPasswordLabel')}</label>
                    <input
                      type="password"
                      className="input"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                    <small className="form-text">{t('minCharacters')}</small>
                  </div>

                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={loading}
                  >
                    {loading ? t('updatingBtn') : t('updatePasswordBtn')}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card danger-zone">
              <h2 className="card-title">{t('dangerTabName')}</h2>
              <div className="danger-content">
                <div>
                  <h3>{t('deleteAccountTitle')}</h3>
                  <p>{t('deleteAccountDesc')}</p>
                </div>
                <button
                  className="button button-danger"
                  onClick={() => setShowDeleteConfirmModal(true)}
                  disabled={loading}
                >
                  {loading ? t('deletingBtn') : t('deleteAccountBtn')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={closeDeleteConfirmModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('confirmDeleteTitle')}</h2>
              <button className="close-button" onClick={closeDeleteConfirmModal}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {deleteStep === 1 ? t('confirmDeleteAccountText') : t('confirmDeleteAccountText2')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={closeDeleteConfirmModal}
                disabled={loading}
              >
                {t('keepBtn')}
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={proceedDeleteAccount}
                disabled={loading}
              >
                {loading ? t('deletingBtn') : (deleteStep === 1 ? t('deleteBtn') : t('confirm'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;