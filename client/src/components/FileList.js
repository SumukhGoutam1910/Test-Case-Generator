
import React, { useEffect, useState } from 'react';

function buildTree(paths) {
  const root = {};
  for (const path of paths) {
    const parts = path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node[part]) {
        node[part] = i === parts.length - 1 ? null : {};
      }
      node = node[part] || node;
    }
  }
  return root;
}

export default function FileList({ repo, token, onSelectFiles }) {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:5000/api/github/files?repo=${repo.name}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await res.json();
        setFiles(data);
      } catch (e) {
        setError('Failed to fetch files');
      }
      setLoading(false);
    }
    fetchFiles();
  }, [repo, token]);

  const handleCheck = (file) => {
    setSelected(prev => {
      const exists = prev.includes(file);
      const next = exists ? prev.filter(f => f !== file) : [...prev, file];
      onSelectFiles(next);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelected(files);
    onSelectFiles(files);
  };

  const handleUnselectAll = () => {
    setSelected([]);
    onSelectFiles([]);
  };

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  function renderTree(node, parentPath = '') {
    return Object.entries(node).map(([key, value]) => {
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      if (value === null) {
        // File
        return (
          <div key={fullPath} className="file-grid-item">
            <label className="file-label">
              <input
                type="checkbox"
                className="file-checkbox"
                checked={selected.includes(fullPath)}
                onChange={() => handleCheck(fullPath)}
              />
              <span className="file-name">{key}</span>
            </label>
          </div>
        );
      } else {
        // Folder
        return (
          <div key={fullPath} className="file-folder">
            <div className="file-folder-header" onClick={() => toggleExpand(fullPath)}>
              <span className="file-folder-icon">{expanded[fullPath] ? '📂' : '📁'}</span>
              <span className="file-folder-name">{key}</span>
            </div>
            {expanded[fullPath] && (
              <div className="file-folder-children">
                {renderTree(value, fullPath)}
              </div>
            )}
          </div>
        );
      }
    });
  }

  if (loading) return <div className="spinner" />;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  const tree = buildTree(files);

  return (
    <div>
      <div className="file-header">
        <h3 className="file-heading">Select Files</h3>
        <div className="file-controls">
          <button className="select-button" onClick={handleSelectAll}>
            Select All
          </button>
          <button className="select-button" onClick={handleUnselectAll}>
            Unselect All
          </button>
        </div>
      </div>
      <div className="file-tree">
        {renderTree(tree)}
      </div>
    </div>
  );
}
