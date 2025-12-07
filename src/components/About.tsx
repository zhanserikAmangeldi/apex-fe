import { Link } from 'react-router-dom';
import { FaReact, FaRocket, FaDatabase } from 'react-icons/fa';
import './About.css';
import logoImage from '../assets/logo.png';

const About = () => {
  return (
    <div className="about-page">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
        <div className="glow-circle circle-3"></div>
        <div className="wavy-grid"></div>
      </div>

      {/* Header */}
      <header className="about-header">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <img src={logoImage} alt="Apex Logo" className="logo-img" />
          </div>
          <span className="logo-text">Apex</span>
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/team" className="nav-link">Team</Link>
          <Link to="/login" className="nav-link sign-in-link">Sign In</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="about-main">
        <div className="about-container">
          <section className="about-hero">
            <h1 className="about-title">About Apex</h1>
            <p className="about-subtitle">
              A modern platform for self-paced learning using the Zettelkasten method with AI integration
            </p>
          </section>

          <section className="mission-section">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              Our main goal is to help structure people's knowledge and accelerate their learning by providing feedback 
              in the form of statistics, recommendations for future topics, review cards (similar to Anki), and much more.
            </p>
          </section>

          <section className="features-section">
            <h2 className="section-title">Features</h2>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-number">01</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Topic Creation</h3>
                  <p className="feature-item-text">
                    Create topics (repositories) to organize your knowledge. Each topic is a separate space for studying a specific topic.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">02</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">File Management</h3>
                  <p className="feature-item-text">
                    Create Markdown files, upload files of various types (PDF, MP4, etc.). The structure is organized 
                    as a file tree for easy navigation.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">03</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Personalized Dashboard</h3>
                  <p className="feature-item-text">
                    Create your dashboard and customize widgets that present feedback. For example, a widget with the 
                    statistics you want to receive.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">04</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Interactive Widgets</h3>
                  <p className="feature-item-text">
                    Add interactive widgets, such as a "question of the day." Answer the questions, and we'll save 
                    it in the learning context for better understanding.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">05</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Relationship Tree</h3>
                  <p className="feature-item-text">
                    Browse the relationship tree of your files using hyperlinks or tags. Visualize the connections between 
                    different concepts and ideas.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">06</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Contextual Search</h3>
                  <p className="feature-item-text">
                    Find information in your notes with contextual search that understands the meaning of your queries, 
                    not just keywords.
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-number">07</div>
                <div className="feature-content">
                  <h3 className="feature-item-title">Collaboration</h3>
                  <p className="feature-item-text">
                    Work together on topics with collaboration capabilities. Co-learning and knowledge sharing become easier.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="tech-section">
            <h2 className="section-title">Technologies</h2>
            <div className="tech-grid">
              <div className="tech-card">
                <div className="tech-icon"><FaReact /></div>
                <h3 className="tech-name">Frontend</h3>
                <p className="tech-desc">React</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon"><FaRocket /></div>
                <h3 className="tech-name">Backend</h3>
                <p className="tech-desc">Golang + Python</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon"><FaDatabase /></div>
                <h3 className="tech-name">Database</h3>
                <p className="tech-desc">PostgreSQL</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
