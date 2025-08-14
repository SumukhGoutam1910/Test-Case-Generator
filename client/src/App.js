
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// In your frontend (Vercel app), configure axios:
import axios from 'axios';

// Set up axios defaults
axios.defaults.baseURL = 'https://test-case-generator-6w84.onrender.com';
axios.defaults.withCredentials = true;

// For manual requests, always include credentials
const checkAuth = async () => {
  try {
    const response = await axios.get('/api/github/user', {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
};

// Alternative with fetch
const checkAuthWithFetch = async () => {
  try {
    const response = await fetch(
      'https://test-case-generator-6w84.onrender.com/api/github/user',
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
};

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
  fetch(`${process.env.REACT_APP_BACKEND_URL}/api/github/user`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.accessToken) {
          setToken(data.user.accessToken);
        }
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="app-container">
        <p className="debug">Debug: App is rendering</p>
        {token ? (
          <Dashboard token={token} />
        ) : (
          <Login onLogin={setToken} />
        )}
      </div>
      <Footer />
    </>
  );
}
