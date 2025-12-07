import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ResetPassword.css';
import logoImage from '../assets/logo.png';

const ResetPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement reset password logic
    console.log('Reset password for:', email);
  };

  return (
    <div className="reset-password-page">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
        <div className="wavy-grid"></div>
      </div>

      {/* Header */}
      <header className="reset-header">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <img src={logoImage} alt="Apex Logo" className="logo-img" />
          </div>
          <span className="logo-text">Apex</span>
        </Link>
      </header>

      {/* Split Layout */}
      <main className="reset-split-main">
        {/* Left Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">No Worries.!!</h1>
          <div className="take-me-back-container">
            <Link to="/login" className="take-me-back-button">Take me back.!</Link>
            <div className="dashed-line"></div>
          </div>
        </div>

        {/* Right Section - Reset Password Form */}
        <div className="reset-form-section">
          <div className="reset-form-card">
            <h2 className="form-title">Forgot Password ?</h2>
            <p className="form-subtitle">Please enter you're email</p>

            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="example@mail.com"
                  required
                />
              </div>

              <button type="submit" className="reset-button-gradient">
                Reset Password
              </button>

              <div className="reset-footer">
                <p className="signup-text">
                  Don't have an account ? <Link to="/signup" className="signup-link-text">Signup</Link>
                </p>
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

export default ResetPassword;

