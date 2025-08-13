import React, { useEffect, useState } from 'react';

export default function RepoList({ token, onSelect }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRepos() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5000/api/github/repos', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setRepos(data);
        } else if (data && data.error) {
          setError(data.error);
          setRepos([]);
        } else {
          setRepos([]);
        }
      } catch (e) {
        setError('Failed to fetch repositories');
        setRepos([]);
      }
      setLoading(false);
    }
    fetchRepos();
  }, [token]);

  if (loading) return <div className="spinner" />;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2 className="repo-heading">Select a Repository</h2>
      {repos.length === 0 && !loading && !error && (
        <div className="repo-empty">No repositories found.</div>
      )}
      <ul className="repo-list">
        {(repos || []).map(repo => (
          <li key={repo.id}>
            <button className="repo-card" onClick={() => onSelect(repo)}>{repo.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
