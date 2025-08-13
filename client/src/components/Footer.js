import React from 'react';
import { FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';
import './footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="https://www.instagram.com/sumukh_0804/" target="_blank" rel="noopener noreferrer" title="Instagram">
          <FaInstagram size={28} />
        </a>
        <a href="https://www.linkedin.com/in/sumukh-goutam-4ab13529b/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
          <FaLinkedin size={28} />
        </a>
        <a href="https://github.com/SumukhGoutam1910" target="_blank" rel="noopener noreferrer" title="GitHub">
          <FaGithub size={28} />
        </a>
      </div>
      <div className="footer-text">© {new Date().getFullYear()} Test Case Generator &mdash; Powered by GitHub Copilot  &mdash; Sumukh Goutam</div>
    </footer>
  );
}
