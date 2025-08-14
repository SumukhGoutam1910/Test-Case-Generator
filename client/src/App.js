import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Configure axios defaults
axios.defaults.baseURL = 'https://test-case-generator-6w84.onrender.com';
axios.defaults.withCredentials = true;

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract JWT token from URL after OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const jwtToken = urlParams.get('token');
    
    if (jwtToken) {
      console.log('Token found in URL, storing...');
      localStorage.setItem('authToken', jwtToken);
      setToken(jwtToken);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      // Check for existing token in localStorage
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        console.log('Found stored token');
        setToken(storedToken);
      }
    }
    
    setLoading(false);
  }, []);

  // Set up axios authorization header when token changes
  useEffect(() => {
    if (token) {
      console.log('Setting up axios authorization header');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user info
      checkAuth();
    } else {
      // Clear authorization header if no token
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await axios.get('/api/github/user');
      console.log('Auth check successful:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  };

  const handleLogin = (newToken) => {
    console.log('Login successful, setting token');
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="app-container">
        {token && user ? (
          <Dashboard token={token} user={user} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
      <Footer />
    </>
  );
}