import React, { useState } from 'react';
import RepoList from './RepoList';
import FileList from './FileList';
import SummaryList from './SummaryList';
import CodeEditor from './CodeEditor';
import UIverseButton from './UIverseButton';
import './uiverse.css';


export default function Dashboard({ token }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // 0: repo, 1: files

  // ...API calls to backend for repos, files, summaries, code...

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setStep(1);
  };
  const handleBack = () => {
    setStep(0);
    setSelectedRepo(null);
    setSelectedFiles([]);
  };
  const handleForward = () => {
    if (selectedRepo) setStep(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
        {step === 1 && (
          <button className="nav-arrow" onClick={handleBack} title="Back to repositories">&#8592;</button>
        )}
        {step === 0 && (
          <span style={{ width: 40 }} />
        )}
        <div style={{ flex: 1 }} />
        {step === 0 && selectedRepo && (
          <button className="nav-arrow" onClick={handleForward} title="Go to files">&#8594;</button>
        )}
      </div>
      {step === 0 && (
        <div className="repo-list-container">
          <RepoList token={token} onSelect={handleRepoSelect} />
        </div>
      )}
      {step === 1 && selectedRepo && (
        <FileList repo={selectedRepo} token={token} onSelectFiles={setSelectedFiles} />
      )}
      {selectedFiles.length > 0 && (
        <div className="generate-btn-center">
          <UIverseButton onClick={async () => {
            setLoading(true);
            setError('');
            try {
              // ...existing code...
              // Fetch file contents for selected files
              const fileContents = await Promise.all(selectedFiles.map(async (file) => {
                // ...existing code...
                const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/github/file-content?repo=${selectedRepo.name}&path=${file}`, {
                  headers: { Authorization: `Bearer ${token}` },
                  credentials: 'include',
                });
                // ...existing code...
                if (!res.ok) {
                  throw new Error(`Failed to fetch ${file}: ${res.status}`);
                }
                // ...existing code...
                const data = await res.json();
                // ...existing code...
                let content = data.content || '';
                const maxLength = 8000; // Limit to ~8KB per file
                if (content.length > maxLength) {
                  content = content.substring(0, maxLength) + '\n\n... (file truncated for processing)';
                }
                return { filename: file, content };
              }));
              // ...existing code...
              const aiRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/summaries`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ files: fileContents }),
                credentials: 'include',
              });
              if (!aiRes.ok) {
                throw new Error(`AI API failed: ${aiRes.status}`);
              }
              const aiData = await aiRes.json();
              setSummaries(aiData.summaries || []);
            } catch (e) {
              setError(`Failed to generate summaries: ${e.message}`);
            }
            setLoading(false);
          }}>
            ⚡ Generate Test Case Summaries
          </UIverseButton>
        </div>
      )}
  <SummaryList summaries={summaries} onSelect={setSelectedSummary} selectedSummary={selectedSummary} />
      {selectedSummary && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
          <UIverseButton onClick={async () => {
            setLoading(true);
            setError('');
            try {
              const aiRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/testcode`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ summary: selectedSummary }),
                credentials: 'include',
              });
              if (!aiRes.ok) {
                throw new Error(`AI API failed: ${aiRes.status}`);
              }
              const aiData = await aiRes.json();
              setTestCode(aiData.code || '');
            } catch (e) {
              setError(`Failed to generate test code: ${e.message}`);
            }
            setLoading(false);
          }}>
            ⚡ Generate Test Code
          </UIverseButton>
        </div>
      )}
      {loading && <div className="spinner" />}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {testCode && (
        <div className="testcode-outer-container">
          <div className="testcode-container">
            <h3 className="testcode-title">Generated Test Code</h3>
            <div className="testcode-block">
              <CodeEditor code={testCode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
