import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import logoImage from '../assets/logo.png';

const Login = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGetStarted = () => {
    setShowLoginForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login:', login, 'Password:', password);
  };

  // Landing Page State (login1.png)
  if (!showLoginForm) {
    return (
      <div className="login-container">
        {/* Background decorative elements */}
        <div className="bg-decoration">
          <div className="glow-circle circle-1"></div>
          <div className="glow-circle circle-2"></div>
          <div className="glow-circle circle-3"></div>
          <div className="wavy-grid"></div>
        </div>

        {/* Header */}
        <header className="login-header">
          <div className="logo">
            <div className="logo-icon">
              <img src={logoImage} alt="Apex Logo" className="logo-img" />
            </div>
            <span className="logo-text">Apex</span>
          </div>
          <button className="sign-in-button" onClick={handleGetStarted}>
            Sign In
          </button>
        </header>

        {/* Landing Content */}
        <main className="landing-main">
          <div className="landing-content">
            <div className="landing-tag">AI-Powered Learning Platform</div>
            <h1 className="landing-title">Master Knowledge with Apex & AI</h1>
            <p className="landing-description">
              Transform your self-study experience with an intelligent note-taking system that connects ideas, discovers patterns and accelerates your learning through AI-powered insights
            </p>
            <button className="get-started-button" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Login Form State (login2.png)
  return (
    <div className="login-container">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
        <div className="glow-circle circle-3"></div>
        <div className="wavy-grid"></div>
      </div>

      {/* Header */}
      <header className="login-header">
        <div className="logo">
          <div className="logo-icon">
            <img src={logoImage} alt="Apex Logo" className="logo-img" />
          </div>
          <span className="logo-text">Apex</span>
        </div>
      </header>

      {/* Split Layout */}
      <main className="login-split-main">
        {/* Left Section - Welcome Message */}
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome Back .!</h1>
          <div className="skip-lag-container">
            <div className="skip-lag-box">Skip the lag ?</div>
            <div className="dashed-line"></div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="login-form-section">
          <div className="login-form-card">
            <h2 className="form-title">Login</h2>
            <p className="form-subtitle">Glad you're back.!</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  type="text"
                  id="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="form-input"
                  placeholder="Username"
                  required
                />
              </div>

              <div className="form-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {showPassword ? (
                      <path d="M10 3C5 3 1.73 7.11 1 10C1.73 12.89 5 17 10 17C15 17 18.27 12.89 19 10C18.27 7.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                    ) : (
                      <>
                        <path d="M10 3C5 3 1.73 7.11 1 10C1.73 12.89 5 17 10 17C15 17 18.27 12.89 19 10C18.27 7.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                        <path d="M2 2L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span>Remember me</span>
                </label>
              </div>

              <button type="submit" className="login-button-gradient">
                Login
              </button>

              <div className="forgot-password-link">
                <Link to="/reset-password" className="forgot-password">Forgot password?</Link>
              </div>

              <div className="separator">
                <div className="separator-line"></div>
                <span className="separator-text">Or</span>
                <div className="separator-line"></div>
              </div>

              <div className="social-login">
                <button type="button" className="social-button google">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20z" fill="#34A853"/>
                    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                  </svg>
                </button>
                <button type="button" className="social-button facebook">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" fill="#1877F2"/>
                  </svg>
                </button>
                <button type="button" className="social-button github">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C17.138 18.197 20 14.442 20 10.017 20 4.484 15.522 0 10 0z" fill="currentColor"/>
                  </svg>
                </button>
              </div>

            <div className="signup-footer">
              <p className="signup-text">Don't have an account ? <Link to="/signup" className="signup-link-text">Signup</Link></p>
              <div className="footer-links">
                <a href="#" className="footer-link">Terms & Conditions</a>
                <a href="#" className="footer-link">Support</a>
                <a href="#" className="footer-link">Customer Care</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
    </div>
  );
};

export default Login;
