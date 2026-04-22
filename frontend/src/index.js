import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "@/index.css";
import App from "@/App";

// Dual-mode auth: send httpOnly cookies alongside Bearer token on every request.
// Safe for same-origin (Kubernetes ingress) — no CORS credentials change needed.
axios.defaults.withCredentials = true;

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
