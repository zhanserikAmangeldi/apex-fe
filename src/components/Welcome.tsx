import { Link } from 'react-router-dom';
import { FaBook, FaRobot, FaChartBar, FaLink, FaSearch, FaUsers } from 'react-icons/fa';
import './Welcome.css';
import logoImage from '../assets/logo.png';

const Welcome = () => {
  return (
    <div className="welcome-page">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
        <div className="glow-circle circle-3"></div>
        <div className="wavy-grid"></div>
      </div>

      {/* Header */}
      <header className="welcome-header">
        <div className="logo">
          <div className="logo-icon">
            <img src={logoImage} alt="Apex Logo" className="logo-img" />
          </div>
          <span className="logo-text">Apex</span>
        </div>
        <nav className="nav-links">
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/team" className="nav-link">Team</Link>
          <Link to="/login" className="nav-link sign-in-link">Sign In</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="welcome-main">
        <div className="welcome-content">
          <div className="welcome-tag">AI-Powered Learning Platform</div>
          <h1 className="welcome-title">Master Knowledge with Apex & AI</h1>
          <p className="welcome-description">
            Transform your self-study experience with an intelligent note-taking system that connects ideas, 
            discovers patterns and accelerates your learning through AI-powered insights
          </p>
          <div className="welcome-buttons">
            <Link to="/signup" className="get-started-button">Get Started</Link>
            <Link to="/about" className="learn-more-button">Learn More</Link>
          </div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><FaBook /></div>
              <h3 className="feature-title">Zettelkasten Method</h3>
              <p className="feature-description">
                Organize your knowledge using the proven zettelkasten methodology for better retention and connections
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaRobot /></div>
              <h3 className="feature-title">AI Integration</h3>
              <p className="feature-description">
                Get intelligent recommendations, statistics, and personalized learning insights powered by AI
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaChartBar /></div>
              <h3 className="feature-title">Smart Dashboard</h3>
              <p className="feature-description">
                Customize your dashboard with widgets for statistics, review cards, and interactive learning tools
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaLink /></div>
              <h3 className="feature-title">Knowledge Graph</h3>
              <p className="feature-description">
                Visualize connections between your notes through hyperlinks, tags, and relationship trees
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaSearch /></div>
              <h3 className="feature-title">Contextual Search</h3>
              <p className="feature-description">
                Find information quickly with AI-powered contextual search across all your notes and files
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaUsers /></div>
              <h3 className="feature-title">Collaboration</h3>
              <p className="feature-description">
                Work together on topics with collaborative features for shared learning and knowledge building
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Welcome;

