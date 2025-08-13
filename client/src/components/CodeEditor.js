import React from 'react';

export default function CodeEditor({ code }) {
  return (
    <div>
      <h3>Generated Test Code</h3>
      <pre className="code-editor">{code}</pre>
    </div>
  );
}
