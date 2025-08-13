import React from "react";
import "./uiverse.css";

export default function UIverseButton({ onClick, children }) {
  return (
    <button className="uiverse-btn" onClick={onClick}>
      {children}
    </button>
  );
}
