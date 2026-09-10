import logo from '../assets/ti-logo.png';
import './Navbar.css';
import { track } from '../lib/telemetry';

export default function Navbar() {
  const handleNavigation = (target: string) => track('navigation_clicked', { target });
  return (
    <nav className="floating-navbar">
        <div className="navbar-logo">
            <img src={logo} alt="TI Logo" />
        </div>

        <div className="navbar-links">
            <a href="#home" onClick={() => handleNavigation('home')}>Home</a>
            <a href="#events" onClick={() => handleNavigation('events')}>Events</a>
            <a href="#team" onClick={() => handleNavigation('team')}>Team</a>
            <a href="#gallery" onClick={() => handleNavigation('gallery')}>Gallery</a>
            <a href="#contact" onClick={() => handleNavigation('contact')}>Contact</a>
            <a href="#signin" className="signin-btn" onClick={() => handleNavigation('signin_placeholder')}>Sign in</a>
        </div>
    </nav>
  );
}
