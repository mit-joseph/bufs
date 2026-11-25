// Google Gemini, streamed. Key fail-over: if key 1 is expired/invalid/out of quota, key 2 is used (and key 1 is skipped for a while).
// Speed: "fast" mode uses the lightest model, thinking is switched off, answers stream word by word, and the last working key+model is tried first.
const ROOT = () => process.env.GEMINI_BASE || "https://generativelanguage.googleapis.com/v1beta";
const bad = new Map(), good = { fast: null, smart: null };
export const geminiKeys = () => [...new Set([process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2, ...(process.env.GEMINI_API_KEYS || "").split(",")].map((s) => (s || "").trim()).filter(Boolean))];
const FAST = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"], SMART = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const models = (mode) => [...new Set([mode === "fast" ? process.env.GEMINI_FAST_MODEL : process.env.GEMINI_MODEL, ...(mode === "fast" ? FAST : SMART), "gemini-flash-latest"].filter(Boolean))];
const thinking = (m) => (m.startsWith("gemini-3") ? { thinkingLevel: "low" } : /2\.5-flash/.test(m) ? { thinkingBudget: 0 } : null);
const withThinking = (body, m, on = true) => { const t = on && thinking(m); return t ? { ...body, generationConfig: { ...body.generationConfig, thinkingConfig: t } } : body; };
const errOf = async (r) => { const t = await r.text().catch(() => ""); try { const d = JSON.parse(t), e = Array.isArray(d) ? d[0]?.error : d.error; return e?.message || t.slice(0, 200); } catch { return t.slice(0, 200) || "HTTP " + r.status; } };
const keyIssue = (status, msg) => [401, 403, 429].includes(status) || /api key|expired|key invalid/i.test(msg);

function textStream(src) {
  const dec = new TextDecoder(), enc = new TextEncoder();
  return new ReadableStream({
    async start(ctrl) {
      const rd = src.getReader(); let buf = "", any = false;
      try {
        for (;;) {
          const { done, value } = await rd.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let i; while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            try { const j = JSON.parse(line.slice(5)), t = (j.candidates?.[0]?.content?.parts || []).map((p) => (p.thought ? "" : p.text || "")).join(""); if (t) { any = true; ctrl.enqueue(enc.encode(t)); } } catch {}
          }
        }
        if (!any) ctrl.enqueue(enc.encode("I could not answer that. Please try rephrasing."));
      } catch { if (!any) ctrl.enqueue(enc.encode("The connection to the AI was interrupted. Please try again.")); }
      ctrl.close();
    },
  });
}

export async function stream(body, mode = "fast", f = fetch) {
  const all = geminiKeys();
  if (!all.length) return { status: 503, error: "AI is not set up yet. Copy .env.example to .env.local, paste your Gemini keys in it, and restart the app." };
  const now = Date.now(), live = all.filter((k) => (bad.get(k) || 0) < now), order = live.length ? live : all, g = good[mode];
  const pairs = []; if (g && order.includes(g.k)) pairs.push([g.k, g.m]);
  for (const k of order) for (const m of models(mode)) pairs.push([k, m]);
  const skip = new Set(); let last = "";
  for (const [k, m] of pairs) {
    if (skip.has(k)) continue;
    let r;
    try {
      const go = (on) => f(`${ROOT()}/models/${m}:streamGenerateContent?alt=sse`, { method: "POST", headers: { "x-goog-api-key": k, "content-type": "application/json" }, body: JSON.stringify(withThinking(body, m, on)) });
      r = await go(true);
      if (r.status === 400) { const msg = await errOf(r); if (/thinking/i.test(msg)) r = await go(false); else { last = msg; if (keyIssue(400, msg)) bad.set(k, now + 30 * 6e4); skip.add(k); continue; } }
    } catch (e) { last = e.message; skip.add(k); continue; }
    if (r.ok && r.body) { good[mode] = { k, m }; return { stream: textStream(r.body) }; }
    last = await errOf(r);
    if (r.status === 404) continue;
    if (keyIssue(r.status, last)) bad.set(k, now + (r.status === 429 ? 6e4 : 30 * 6e4));
    skip.add(k);
  }
  return { status: 502, error: "AI is unavailable right now. " + last.slice(0, 160) };
}

// Warm-up and key check: opens the connection to Google early and tells the app whether a key works.
export async function check(f = fetch) {
  const ks = geminiKeys(); if (!ks.length) return { ready: false, reason: "no-keys" };
  const now = Date.now(), live = ks.filter((k) => (bad.get(k) || 0) < now);
  for (const k of live.length ? live : ks) {
    try { const r = await f(`${ROOT()}/models?pageSize=1`, { headers: { "x-goog-api-key": k } }); if (r.ok) return { ready: true }; const msg = await errOf(r); if (keyIssue(r.status, msg)) bad.set(k, now + 30 * 6e4); } catch {}
  }
  return { ready: false, reason: "keys-rejected" };
}
