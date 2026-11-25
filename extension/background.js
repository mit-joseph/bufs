importScripts("collect.js");
const BASE = "https://canvas.bufs.ac.kr";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function jget(path) {
  try { const r = await fetch(BASE + path, { credentials: "include", headers: { Accept: "application/json" } }), t = await r.text(); let d = null; try { d = JSON.parse(t.replace(/^while\(1\);/, "")); } catch {} return { s: r.status, d }; }
  catch { return { s: 0, d: null }; }
}
function loaded(tabId, ms) {
  return new Promise((res) => {
    const done = () => { chrome.tabs.onUpdated.removeListener(h); clearTimeout(t); res(); };
    const h = (id, info) => { if (id === tabId && info.status === "complete") done(); };
    const t = setTimeout(done, ms); chrome.tabs.onUpdated.addListener(h);
    chrome.tabs.get(tabId).then((tab) => { if (tab.status === "complete") done(); }).catch(() => {});
  });
}
async function readAll(tabId) {
  const res = { rows: [], kinds: { video: 0, file: 0, assignment: 0 }, calls: [], text: "" };
  let frames = []; try { frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: bufsReadRows }); } catch {}
  for (const f of frames) { const r = f.result; if (!r) continue; res.rows = res.rows.concat(r.rows || []); for (const k of ["video", "file", "assignment"]) res.kinds[k] += (r.kinds && r.kinds[k]) || 0; res.calls = res.calls.concat(r.calls || []); if (!res.text && r.text) res.text = r.text; }
  return res;
}
async function scrapeCourse(c) {
  const rec = { id: c.id, name: c.name, rows: [], api: [], calls: [], note: "", text: "" };
  const tabs = (await jget(`/api/v1/courses/${c.id}/tabs`)).d || [];
  const t = tabs.find((x) => /weekly/i.test(x.label || "")) || tabs.find((x) => /learning/i.test(x.label || ""));
  if (!t) { rec.note = "No Weekly Learning tab"; return rec; }
  const tab = await chrome.tabs.create({ url: t.full_url || BASE + t.html_url, active: false });
  try {
    await loaded(tab.id, 20000);
    let last = -1, stable = 0;
    for (let i = 0; i < 16; i++) {
      await sleep(1800);
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: bufsExpand }); } catch {}
      const r = await readAll(tab.id); rec.rows = r.rows; rec.kinds = r.kinds; rec.calls = r.calls; rec.text = r.text;
      if (r.rows.length && r.rows.length === last) { if (++stable >= 2) break; } else stable = 0;
      last = r.rows.length;
    }
  } catch (e) { rec.note = String((e && e.message) || e); }
  try { await chrome.tabs.remove(tab.id); } catch {}
  for (const u of [...new Set(rec.calls)].slice(0, 6)) {
    try { const r = await fetch(u, { credentials: "include", headers: { Accept: "application/json" } }), d = JSON.parse((await r.text()).replace(/^while\(1\);/, "")); rec.api.push({ url: u.replace(BASE, "").slice(0, 200), data: d }); } catch {}
  }
  return rec;
}
async function sync(progress) {
  const cr = await jget("/api/v1/courses?enrollment_state=active&per_page=100");
  if (!Array.isArray(cr.d)) throw new Error("You are not signed in to BUFS in this browser. Open canvas.bufs.ac.kr, sign in, then try again.");
  const cs = cr.d.filter((c) => c.name && !c.name.startsWith("[")), out = { app: "bufs-planner", v: 2, at: new Date().toISOString(), courses: [] };
  let next = 0, done = 0;
  const worker = async () => { while (next < cs.length) { const c = cs[next++]; progress({ done, total: cs.length, course: c.name }); out.courses.push(await scrapeCourse(c)); done++; progress({ done, total: cs.length }); } };
  await Promise.all([worker(), worker(), worker()]);
  return out;
}
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "planner") return;
  port.onMessage.addListener(async (m) => {
    if (m.type !== "sync") return;
    const ka = setInterval(() => { try { port.postMessage({ type: "ping" }); } catch {} }, 20000);
    try { port.postMessage({ type: "result", result: await sync((p) => { try { port.postMessage({ type: "progress", ...p }); } catch {} }) }); }
    catch (e) { try { port.postMessage({ type: "error", error: String((e && e.message) || e) }); } catch {} }
    clearInterval(ka);
  });
});
