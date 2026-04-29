import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * In live mode, the panel firmware loads /libraries/cr-com-lib.js via a
 * <script> tag (we add it from index.html) which exposes window.CrComLib.
 * For WebXPanel we'd similarly add /libraries/webxpanel.js. cip.ts reads
 * window.CrComLib directly — no bundled import.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
