import React from 'react';
import UIverseButton from './UIverseButton';
import './uiverse.css';

export default function Login({ onLogin }) {
  const handleLogin = () => {
  window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/github`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '24px' }}>
      <p style={{ fontSize: '1.15rem', color: '#ffffffff', marginBottom: '18px' }}>Sign in to generate test cases for your GitHub projects</p>
      <UIverseButton onClick={handleLogin}>Login with GitHub</UIverseButton>
    </div>
  );
}
