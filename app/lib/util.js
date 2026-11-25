export const APP = { name: "BUFS Planner", tag: "Your BUFS study co-pilot" };
export const ROOT = "https://canvas.bufs.ac.kr";
export const PAL = ["#3b5bff", "#8b5cf6", "#e5338d", "#f2552c", "#0a9d7a", "#0e8fd6", "#c2410c"];
export const TZ = "Asia/Seoul";
export const F = (iso, o, l = "en-GB") => new Intl.DateTimeFormat(l, { timeZone: TZ, ...o }).format(new Date(iso));
export const dkey = (iso) => F(iso, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
export const fmt = (iso) => (iso ? F(iso, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "No date");
export const plain = (h = "") => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
export const abs = (u) => (!u ? null : u.startsWith("/") ? ROOT + u : u);
export const DONE = ["submitted", "graded", "pending_review"];
export const KIND = { assignment: ["Assignment", "#4f6bff", "doc"], quiz: ["Quiz", "#d946ef", "quiz"], lecture: ["Video", "#06a6c9", "play"], event: ["Event", "#10b981", "cal"], news: ["Announcement", "#f59e0b", "mega"] };
export const DEF = { on: false, leads: [24, 3, 1], nag: true, kinds: { assignment: true, quiz: true, lecture: true, event: true } };
export const mmss = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");

export const ms = (x) => new Date(x.due) - Date.now();
export const open = (x) => !x.done && x.due;
export const byDue = (a, b) => new Date(a.due) - new Date(b.due);
export function left(iso) {
  const m = new Date(iso) - Date.now(), s = Math.floor(Math.abs(m) / 6e4), d = Math.floor(s / 1440), h = Math.floor((s % 1440) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${s % 60}m` : `${s % 60}m`;
}
const locked = (x) => x.k === "lecture" && x.unlock && new Date(x.unlock) > Date.now();
export function tone(x) {
  if (x.done) return "done";
  if (locked(x)) return "none";
  if (!x.due) return x.k === "lecture" && x.done === false ? "ok" : "none";
  const m = ms(x);
  if (m < 0) return x.k === "event" ? "none" : x.k === "lecture" && x.done !== false ? "none" : "late";
  return m < 864e5 ? "hot" : m < 3 * 864e5 ? "soon" : "ok";
}
export function label(x) {
  if (x.done) return x.score != null ? `${x.score}/${x.pts ?? "?"}` : x.k === "lecture" ? "Complete" : "Submitted";
  if (x.k === "lecture") {
    if (locked(x)) return "Opens " + F(x.unlock, { day: "numeric", month: "short" });
    if (x.due && ms(x) < 0) return x.done === false ? "Missed" : "Closed";
    if (x.due) return left(x.due) + " left";
    return x.pct > 0 ? `${x.pct}% watched` : x.done === false ? "To watch" : "Not tracked";
  }
  if (!x.due) return "No date";
  if (ms(x) < 0) return x.k === "event" ? "Past" : "Overdue";
  return x.k === "event" ? "in " + left(x.due) : left(x.due) + " left";
}
export function notify(t, b, tag) { try { new Notification(t, { body: b, tag, requireInteraction: true }); } catch {} }

export const api = async (path, body = {}) => {
  try {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ...j, ok: r.ok, status: r.status };
  } catch { return { ok: false, status: 0, error: "Lost connection to the app. Is it still running in the terminal?" }; }
};
export const vstate = (x) => (x.done ? "done" : locked(x) ? "locked" : x.done === false ? (x.due && ms(x) < 0 ? "missed" : "todo") : "unknown");

// Streams an AI answer into onText(textSoFar). Returns { text } or { error }.
export async function streamAI(body, onText) {
  try {
    const res = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); return { error: j.error || "Something went wrong." }; }
    const rd = res.body.getReader(), dec = new TextDecoder(); let acc = "";
    for (;;) { const { done, value } = await rd.read(); if (done) break; acc += dec.decode(value, { stream: true }); onText(acc); }
    return { text: acc };
  } catch { return { error: "Lost connection to the app." }; }
}
