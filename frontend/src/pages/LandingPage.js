// frontend/src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { ChevronRight, DollarSign, TrendingUp, Shield, Smartphone, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/loginService'; // 
import './LandingPage.css'; // Import your CSS styles

const LandingPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        login(username, password).then(token => {
            localStorage.setItem('token', token); // Store the token in local storage
            setIsLoading(false);
            navigate('/dashboard'); // Redirect to dashboard on successful login
        }).catch(err => {
            setError(err.message); // Set error message if login fails
            setIsLoading(true);
        })
    };
    const features = [
        { icon: TrendingUp, title: "Smart Analytics", desc: "AI-powered insights" },
        { icon: Shield, title: "Bank-Level Security", desc: "256-bit encryption" },
        { icon: Smartphone, title: "Mobile First", desc: "Seamless experience" }
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
                            <h1 className="brand-title">
                                Finance Stat
                            </h1>
                        </div>

                        <h2 className="hero-title">
                            Your Money,
                            <br />
                            <span className="gradient-text">
                                Simplified
                            </span>
                        </h2>

                        <p className="hero-description">
                            Take control of your financial future with intelligent tracking,
                            smart budgeting, and personalized insights that grow with you.
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

                {/* Right side - Login form */}
                <div className="login-section">
                    <div className={`login-container ${mounted ? 'animate-in' : ''}`}>
                        <div className="login-box">
                            <div className="login-header">
                                <h3 className="login-title">Welcome Back</h3>
                                <p className="login-subtitle">Sign in to your account</p>
                            </div>

                            <div className="form-container">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-input"
                                        style={{ paddingRight: '48px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleLogin}
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
                            </div>

                            

                            <div className="signup-section">
                                <p className="signup-text">
                                    Don't have an account?{' '}
                                    <button className="signup-link">
                                        Callme
                                    </button>
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
