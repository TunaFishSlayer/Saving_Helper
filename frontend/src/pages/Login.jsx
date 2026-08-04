// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound, Mail, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import { localDb } from '../services/localDb';
import syncService from '../services/syncService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginGuest } = useAuth();
  const { locale, toggleLanguage, t } = useLanguage();
  
  const fromGoOnline = location.state?.fromGoOnline;
  
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    code: '',
    newPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const resetState = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', name: '', code: '', newPassword: '' });
  };

  // Handle Login & Register
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (mode === 'login') {
        response = await authService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        response = await authService.register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
      }

      // Check if there is local guest data
      const transactionsCount = await localDb.transactions.count();
      const budgetsCount = await localDb.budgets.count();
      const goalsCount = await localDb.goals.count();
      const subscriptionsCount = await localDb.subscriptions.count();
      const hasGuestData = (transactionsCount + budgetsCount + goalsCount + subscriptionsCount) > 0;

      if (hasGuestData) {
        if (mode === 'register' && fromGoOnline) {
          login(response.token, response.user);
          await syncService.mergeGuestDataToServer();
          navigate('/');
        } else {
          setPendingAuth({ token: response.token, user: response.user });
          setShowMergePrompt(true);
        }
      } else {
        login(response.token, response.user);
        await syncService.clearLocalDatabase();
        await syncService.pullLatestData();
        navigate('/');
      }
    } catch (err) {
      setError(err.message || t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleMergeData = async () => {
    if (!pendingAuth) return;
    setLoading(true);
    try {
      login(pendingAuth.token, pendingAuth.user);
      await syncService.mergeGuestDataToServer();
      setShowMergePrompt(false);
      navigate('/');
    } catch (err) {
      setError(err.message || t('failedMergeData'));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardLocalData = async () => {
    if (!pendingAuth) return;
    setLoading(true);
    try {
      login(pendingAuth.token, pendingAuth.user);
      await syncService.clearLocalDatabase();
      await syncService.pullLatestData();
      setShowMergePrompt(false);
      navigate('/');
    } catch (err) {
      setError(err.message || t('failedSyncCloud'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1: Request Reset Code
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.requestResetPassword(formData.email);
      setSuccess(`${t('resetCodeSentTo')} ${formData.email}`);
      setMode('reset'); // Move to step 2
    } catch (err) {
      setError(err.message || t('failedSendCode'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Code & Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(formData.email, formData.code, formData.newPassword);
      setSuccess(t('resetSuccessMsg'));
      setTimeout(() => {
        resetState('login'); // Redirect to login after 2s
      }, 2000);
    } catch (err) {
      setError(err.message || t('failedResetPassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Language Switcher Pill */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <button
          type="button"
          onClick={() => toggleLanguage(locale === 'vi' ? 'en' : 'vi')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '24px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1e293b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
        >
          <Globe size={18} style={{ color: 'var(--primary)' }} />
          <span>{locale === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        </button>
      </div>

      <div className="login-card">
        <div className="login-header">
          {/* Use your logo class here */}
          <img src="/logo.png" alt="Logo" className="login-logo" />
          
          <h1 className="login-title">
            {mode === 'forgot' ? t('resetPasswordTitle') : 
             mode === 'reset' ? t('newPasswordTitle') : 
             t('loginTitle')}
          </h1>
          <p className="login-subtitle">
            {mode === 'forgot' ? t('resetPasswordSubtitle') : 
             mode === 'reset' ? t('newPasswordSubtitle') : 
             t('loginSubtitle')}
          </p>
        </div>

        {/* Tab Switcher (Only visible in Login/Register mode) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="tab-container">
            <button
              type="button"
              className={`tab-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => resetState('login')}
            >
              {t('tabLogin')}
            </button>
            <button
              type="button"
              className={`tab-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => resetState('register')}
            >
              {t('tabRegister')}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message" style={{marginBottom: '1rem', textAlign: 'center'}}>
            <span>{success}</span>
          </div>
        )}

        {/* --- FORM 1: LOGIN / REGISTER --- */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleAuth} className="form">
            {mode === 'register' && (
              <input
                type="text"
                name="name"
                placeholder={t('fullNamePlaceholder')}
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder={t('emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />

            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={t('passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
                className="input"
                required
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {mode === 'login' && (
              <div style={{textAlign: 'right'}}>
                <button 
                  type="button" 
                  className="link-button"
                  style={{fontSize: '0.9rem'}}
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setMode('forgot');
                  }}
                >
                  {t('forgotPasswordLink')}
                </button>
              </div>
            )}

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? t('pleaseWait') : (mode === 'login' ? t('loginBtn') : t('registerBtn'))}
            </button>

            {!fromGoOnline && (
              <>
                <div className="offline-divider" style={{margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                  <span style={{height: '1px', flex: 1, backgroundColor: '#e2e8f0'}}></span>
                  <span style={{fontSize: '0.85rem', color: '#94a3b8'}}>{t('orDivider')}</span>
                  <span style={{height: '1px', flex: 1, backgroundColor: '#e2e8f0'}}></span>
                </div>

                <button
                  type="button"
                  className="button"
                  style={{backgroundColor: '#f1f5f9', color: '#334155', borderWidth: '1px', borderColor: '#cbd5e1'}}
                  onClick={() => {
                    loginGuest();
                    navigate('/');
                  }}
                >
                  {t('useOfflineGuest')}
                </button>
              </>
            )}
          </form>
        )}

        {/* --- FORM 2: FORGOT PASSWORD (EMAIL) --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="form">
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder={t('enterEmailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
              <div className="input-icon"><Mail size={20}/></div>
            </div>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? t('sendingCode') : t('sendResetCode')}
            </button>
            
            <button 
              type="button" 
              className="link-button"
              style={{marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}
              onClick={() => resetState('login')}
            >
              <ArrowLeft size={16} /> {t('backToLogin')}
            </button>
          </form>
        )}

        {/* --- FORM 3: RESET PASSWORD (CODE + NEW PASS) --- */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="form">
            <div className="input-group">
              <input
                type="text"
                name="code"
                placeholder={t('verificationCodePlaceholder')}
                value={formData.code}
                onChange={handleChange}
                className="input"
                maxLength="6"
                required
              />
              <div className="input-icon"><KeyRound size={20}/></div>
            </div>

            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder={t('newPasswordPlaceholder')}
                value={formData.newPassword}
                onChange={handleChange}
                className="input"
                minLength="6"
                required
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? t('resettingPassword') : t('setNewPassword')}
            </button>

            <button 
              type="button" 
              className="link-button"
              style={{marginTop: '10px'}}
              onClick={() => setMode('forgot')}
            >
              {t('resendCodeLink')}
            </button>
          </form>
        )}
      </div>

      {showMergePrompt && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px',
            maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{fontSize: '1.4rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem'}}>
              {t('localDataFoundTitle')}
            </h2>
            <p style={{fontSize: '0.95rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5'}}>
              {t('localDataFoundDesc')}
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleMergeData}
                disabled={loading}
              >
                {t('mergeRecordsBtn')}
              </button>
              
              <button
                type="button"
                className="button"
                style={{backgroundColor: '#f1f5f9', color: '#ef4444', borderWidth: '1px', borderColor: '#f87171'}}
                onClick={handleDiscardLocalData}
                disabled={loading}
              >
                {t('discardLocalBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;