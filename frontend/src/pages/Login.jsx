// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { localDb } from '../services/localDb';
import syncService from '../services/syncService';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginGuest } = useAuth();
  
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
      if (transactionsCount > 0) {
        setPendingAuth({ token: response.token, user: response.user });
        setShowMergePrompt(true);
      } else {
        login(response.token, response.user);
        await syncService.pullLatestData();
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
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
      setError(err.message || 'Failed to merge local data');
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
      setError(err.message || 'Failed to sync cloud data');
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
      setSuccess(`Reset code sent to ${formData.email}`);
      setMode('reset'); // Move to step 2
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
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
      setSuccess('Password reset successful! Please login.');
      setTimeout(() => {
        resetState('login'); // Redirect to login after 2s
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {/* Use your logo class here */}
          <img src="/logo.png" alt="Logo" className="login-logo" />
          
          <h1 className="login-title">
            {mode === 'forgot' ? 'Reset Password' : 
             mode === 'reset' ? 'New Password' : 
             'Savings Helper'}
          </h1>
          <p className="login-subtitle">
            {mode === 'forgot' ? 'Enter your email to receive a code' : 
             mode === 'reset' ? 'Enter the code and your new password' : 
             'Manage your finances with ease'}
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
              Login
            </button>
            <button
              type="button"
              className={`tab-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => resetState('register')}
            >
              Register
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
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />

            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
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
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}
            </button>

            <div className="offline-divider" style={{margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
              <span style={{height: '1px', flex: 1, backgroundColor: '#e2e8f0'}}></span>
              <span style={{fontSize: '0.85rem', color: '#94a3b8'}}>or</span>
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
              Use Offline (Guest Mode)
            </button>
          </form>
        )}

        {/* --- FORM 2: FORGOT PASSWORD (EMAIL) --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="form">
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
              <div className="input-icon"><Mail size={20}/></div>
            </div>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            
            <button 
              type="button" 
              className="link-button"
              style={{marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}
              onClick={() => resetState('login')}
            >
              <ArrowLeft size={16} /> Back to Login
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
                placeholder="6-Digit Verification Code"
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
                placeholder="New Password"
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
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>

            <button 
              type="button" 
              className="link-button"
              style={{marginTop: '10px'}}
              onClick={() => setMode('forgot')}
            >
              Resend Code / Change Email
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
              Local Data Found
            </h2>
            <p style={{fontSize: '0.95rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5'}}>
              We found transaction records created while using offline guest mode on this device. How would you like to proceed?
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleMergeData}
                disabled={loading}
              >
                Merge records into my online account
              </button>
              
              <button
                type="button"
                className="button"
                style={{backgroundColor: '#f1f5f9', color: '#ef4444', borderWidth: '1px', borderColor: '#f87171'}}
                onClick={handleDiscardLocalData}
                disabled={loading}
              >
                Discard local data and use cloud records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;