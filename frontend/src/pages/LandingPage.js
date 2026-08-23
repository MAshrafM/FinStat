// frontend/src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { ChevronRight, DollarSign, TrendingUp, Shield, Smartphone, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser, login2FA } from '../services/authService';
import './LandingPage.css';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 2FA state
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const data = await loginUser(username, password, { suppressToast: true });
      if (data.require2FA) {
        setRequire2FA(true);
        setTempToken(data.tempToken);
        setIsLoading(false);
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setIsLoading(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isBackupCodeMode && !backupCode.trim()) {
      setError('Please enter your backup code.');
      return;
    }
    if (!isBackupCodeMode && (!totpCode.trim() || totpCode.trim().length < 6)) {
      setError('Please enter the 6-digit authentication code.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        tempToken,
        ...(isBackupCodeMode ? { backupCode: backupCode.trim() } : { code: totpCode.trim() }),
      };

      const data = await login2FA(payload, { suppressToast: true });
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setIsLoading(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequire2FA(false);
    setTempToken('');
    setTotpCode('');
    setBackupCode('');
    setError('');
  };

  const features = [
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'AI-powered financial insights' },
    { icon: Shield, title: 'Bank-Level Security', desc: 'TOTP 2FA, encrypted secrets & RBAC' },
    { icon: Smartphone, title: 'Mobile First', desc: 'Seamless cross-platform experience' },
  ];

  return (
    <div className="landing-container">
      {/* Animated background elements */}
      <div className="background-effects">
        <div className={`bg-blur-1 ${mounted ? 'animate-in' : ''}`}></div>
        <div className={`bg-blur-2 ${mounted ? 'animate-in' : ''}`}></div>
        <div className={`bg-blur-3 ${mounted ? 'animate-in' : ''}`}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="grid-overlay"></div>

      <div className="content-wrapper">
        {/* Left side - Hero content */}
        <div className="hero-section">
          <div className={`hero-content ${mounted ? 'animate-in' : ''}`}>
            <div className="brand-header">
              <div className="brand-icon">
                <DollarSign size={24} color="white" />
              </div>
              <h1 className="brand-title">Finance Stat</h1>
            </div>

            <h2 className="hero-title">
              Your Money,
              <br />
              <span className="gradient-text">Simplified</span>
            </h2>

            <p className="hero-description">
              Take control of your financial future with intelligent tracking, smart budgeting, and
              enterprise-grade security.
            </p>

            {/* Features */}
            <div className="features-list">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-item ${mounted ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="feature-icon">
                    <feature.icon size={20} color="#c084fc" />
                  </div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login / 2FA form */}
        <div className="login-section">
          <div className={`login-container ${mounted ? 'animate-in' : ''}`}>
            <div className="login-box">
              {!require2FA ? (
                <>
                  <div className="login-header">
                    <h3 className="login-title">Welcome Back</h3>
                    <p className="login-subtitle">Sign in to your account</p>
                  </div>

                  <form onSubmit={handleInitialLogin} className="form-container">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="form-input"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: '48px' }}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="login-button"
                    >
                      {isLoading ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="login-header">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'rgba(168, 85, 247, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#c084fc',
                        }}
                      >
                        <KeyRound size={26} />
                      </div>
                    </div>
                    <h3 className="login-title">Two-Factor Authentication</h3>
                    <p className="login-subtitle">
                      {isBackupCodeMode
                        ? 'Enter an 8-character backup code'
                        : 'Enter the 6-digit code from your authenticator app'}
                    </p>
                  </div>

                  <form onSubmit={handle2FASubmit} className="form-container">
                    {!isBackupCodeMode ? (
                      <div className="form-group">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            fontSize: '1.4rem',
                            letterSpacing: '6px',
                            fontWeight: '600',
                          }}
                          autoFocus
                          required
                        />
                      </div>
                    ) : (
                      <div className="form-group">
                        <input
                          type="text"
                          maxLength={8}
                          placeholder="XXXXXXXX"
                          value={backupCode}
                          onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            letterSpacing: '4px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                          }}
                          autoFocus
                          required
                        />
                      </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="login-button"
                    >
                      {isLoading ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '16px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ArrowLeft size={14} /> Back
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsBackupCodeMode(!isBackupCodeMode);
                          setError('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c084fc',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        {isBackupCodeMode ? 'Use Authenticator App' : 'Use Backup Code'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              <div className="signup-section">
                <p className="signup-text">
                  Enterprise Financial Intelligence &bull; Secured with RBAC & 2FA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="floating-dots dot-1"></div>
      <div className="floating-dots dot-2"></div>
      <div className="floating-dots dot-3"></div>
    </div>
  );
};

export default LandingPage;
