import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Safari/iOS WebKit polyfill for EmptyRanges video bug
// This prevents "Can't find variable: EmptyRanges" errors
if (typeof window !== 'undefined' && !window.EmptyRanges) {
  window.EmptyRanges = {
    length: 0,
    start: () => 0,
    end: () => 0
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
