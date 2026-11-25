// Runs only on the planner page (localhost:3211). Passes messages between the page and the extension.
const post = (m) => window.postMessage({ source: "bufs-ext", ...m }, location.origin);
const version = () => chrome.runtime.getManifest().version;
window.addEventListener("message", (e) => {
  if (e.source !== window || e.origin !== location.origin || !e.data || e.data.source !== "bufs-planner") return;
  if (e.data.type === "ping") post({ type: "pong", version: version() });
  if (e.data.type === "sync") {
    const port = chrome.runtime.connect({ name: "planner" });
    port.onMessage.addListener((r) => { if (r.type === "ping") return; post(r); if (r.type === "result" || r.type === "error") port.disconnect(); });
    port.onDisconnect.addListener(() => {});
    port.postMessage({ type: "sync" });
  }
});
post({ type: "pong", version: version() });
