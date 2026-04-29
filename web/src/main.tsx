import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * In live mode (VITE_CIP_MODE=live), bootstrap the WebXPanel CIP
 * connection to the CP3 once before mounting React. Joins for the
 * panel come from project-config (host: 192.168.50.113, ipId: 0x03).
 * In mock/dev mode we skip this entirely.
 */
async function bootstrap() {
  if (import.meta.env.VITE_CIP_MODE === "live") {
    const { default: WebXPanel } = await import("@crestron/ch5-webxpanel");
    WebXPanel.initialize({
      host: import.meta.env.VITE_CP_HOST || "192.168.50.113",
      ipId: import.meta.env.VITE_CP_IPID || "0x03",
      authToken: import.meta.env.VITE_CP_AUTH_TOKEN || "",
      enableLogging: false,
      // panel uses native CIP via WebSocket; webxpanel auto-detects
    } as any);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
