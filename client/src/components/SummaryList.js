import React from 'react';

export default function SummaryList({ summaries, onSelect, selectedSummary }) {
  if (!summaries.length) return null;

  const generatePDF = () => {
    const content = summaries.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-case-summaries.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const content = summaries.join('\n\n');
    navigator.clipboard.writeText(content).then(() => {
      alert('Test case summaries copied to clipboard!');
    });
  };

  // Parse and format the summaries for better display
  const formatSummary = (summary) => {
    // Handle markdown-style headers and bullet points
    return summary
      .replace(/^##\s+(.+)$/gm, '<h3 class="summary-section-title">$1</h3>')
      .replace(/^\*\*(.+?)\*\*$/gm, '<h4 class="summary-file-title">$1</h4>')
      .replace(/^\d+\.\s+\*\*(.+?)\*\*$/gm, '<h5 class="summary-test-title">$1</h5>')
      .replace(/^\-\s+\*\*Summary:\*\*\s+(.+)$/gm, '<p class="summary-description">$1</p>')
      .replace(/^\-\s+(.+)$/gm, '<p class="summary-point">• $1</p>')
      .replace(/\n/g, '<br>');
  };

  // Render all summaries together, each section clickable and highlighted on hover, with selected summary highlighted
  return (
    <div className="summary-outer-container">
      <div className="summary-container">
        <div className="summary-header">
          <h3 className="summary-title">Test Case Summaries</h3>
          <div className="summary-actions">
            <button className="action-button export-btn" onClick={generatePDF}>
              📄 Export as Text
            </button>
            <button className="action-button copy-btn" onClick={copyToClipboard}>
              📋 Copy All
            </button>
          </div>
        </div>
        <div className="summary-all-cards-container">
          <div className="summary-text" style={{ width: '100%' }}>
            {summaries.map((summary, idx) => (
              <div
                key={idx}
                className={`summary-hoverable${selectedSummary === summary ? ' selected-summary' : ''}`}
                onClick={() => onSelect(summary)}
                dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
                style={{ cursor: 'pointer', marginBottom: '16px' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
