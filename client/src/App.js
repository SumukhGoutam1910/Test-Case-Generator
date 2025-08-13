
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    fetch('http://localhost:5000/api/github/user', {
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
