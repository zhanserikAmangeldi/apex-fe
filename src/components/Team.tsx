import { Link } from 'react-router-dom';
import { FaLaptopCode, FaRobot } from 'react-icons/fa';
import './Team.css';
import logoImage from '../assets/logo.png';

const Team = () => {
  const teamRoles = [
    {
      title: 'Full-stack Development',
      icon: <FaLaptopCode />,
      description: 'Responsible for developing the user interface and server-side of the application',
      members: [
        {
          name: 'Zhanserik',
          role: 'Full-stack Developer',
        },
        {
          name: 'Abdussalam',
          role: 'Full-stack Developer',
        },
      ],
    },
    {
      title: 'Data/ML/AI Engineering',
      icon: <FaRobot />,
      description: 'Creating intelligent systems for data analysis, recommendations, and personalized learning',
      members: [
        {
          name: 'Aizada',
          role: 'Data/ML/AI Engineer',
        },
        {
          name: 'Ayazhan',
          role: 'Data/ML/AI Engineer',
        },
      ],
    },
  ];

  return (
    <div className="team-page">
      {/* Background decorative elements */}
      <div className="bg-decoration">
        <div className="glow-circle circle-1"></div>
        <div className="glow-circle circle-2"></div>
        <div className="glow-circle circle-3"></div>
        <div className="wavy-grid"></div>
      </div>

      {/* Header */}
      <header className="team-header">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <img src={logoImage} alt="Apex Logo" className="logo-img" />
          </div>
          <span className="logo-text">Apex</span>
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/login" className="nav-link sign-in-link">Sign In</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="team-main">
        <div className="team-container">
          <section className="team-hero">
            <h1 className="team-title">Our Team</h1>
            <p className="team-subtitle">
              A team of professionals working to create the best learning platform
            </p>
          </section>

          <section className="team-grid-section">
            <div className="team-roles-grid">
              {teamRoles.map((role, index) => (
                <div key={index} className="team-role-card" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                  <div className="team-role-header">
                    <div className="team-role-icon">{role.icon}</div>
                    <h2 className="team-role-title">{role.title}</h2>
                  </div>
                  <p className="team-role-description">{role.description}</p>
                  <div className="team-members-list">
                    {role.members.map((member, memberIndex) => (
                      <div key={memberIndex} className="team-member-item">
                        <h3 className="team-member-name">{member.name}</h3>
                        <p className="team-member-role">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Team;
