import React, { useState } from 'react';
import './navbar.css';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeout = React.useRef();

  const handleDropdownEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 350);
  };
  return (
    <nav className="navbar">
      <div className="navbar-title">Test Case Generator</div>
      <div className="navbar-links">
        <div className="dropdown" onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
          <button className="dropdown-btn">Other Works ▼</button>
          {dropdownOpen && (
            <div className="dropdown-content">
              <a href="https://kmapsolver.com" target="_blank" rel="noopener noreferrer">KMAP Solver</a>
              <a href="#">College Website (Coming soon)</a>
              <a href="https://community-connect-9ckn.onrender.com/" target="_blank" rel="noopener noreferrer">Community LinkedIn</a>
              <a href="https://serenity-care-portal.lovable.app/" target="_blank" rel="noopener noreferrer">Hospital Management</a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
