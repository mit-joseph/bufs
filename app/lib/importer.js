import { walk } from "./lx.js";
// Turns what the connector (or the manual script) collected into one video list per course.
const rowItem = (r, i) => ({ id: "d" + i, title: r.title, week: r.week ? "Week " + r.week : "Videos", lesson: r.lesson ?? null, att: !!r.att, secs: r.secs || null, pct: r.done ? 100 : null, start: r.start || null, due: r.due || null, end: r.end || null, unlock: null, done: r.done, url: null, type: "video", closed: !!r.closed });
export function fromConnector(j) {
  const courses = {}, meta = {}, notes = [], list = Array.isArray(j?.courses) ? j.courses : []; let n = 0;
  for (const c of list) {
    let api = []; for (const a of c.api || (c.data ? [{ data: c.data }] : [])) api = api.concat(walk(a.data));
    const dom = (c.rows || []).map(rowItem), flags = api.some((v) => v.done !== null);
    const best = dom.length ? dom : api; // the page itself is the truth: what BUFS shows as a video row
    meta[c.id] = { videos: best.length, other: c.kinds ? (c.kinds.file || 0) + (c.kinds.assignment || 0) : 0, note: c.note || "" };
    if (best.length) { courses[c.id] = best; n += best.length; } else notes.push(`${c.name}: ${c.note || "no videos found"}`);
  }
  return { at: j?.at, courses, meta, n, total: list.length, found: Object.keys(courses).length, notes };
}
export function parseImport(text) {
  let j; try { j = JSON.parse(text); } catch { return { error: "That is not the copied result. Run the script again, then paste everything it copied." }; }
  if (j?.app !== "bufs-planner" || !Array.isArray(j.courses)) return { error: "That text did not come from the BUFS Planner script." };
  return fromConnector(j);
}
// Short, shareable summary of what the connector saw (no personal content beyond course names and video titles).
export function diagText(j) {
  return (j?.courses || []).map((c) => `${c.name}\n  videos read from page: ${(c.rows || []).length}${c.kinds ? " (ignored: " + c.kinds.file + " files, " + c.kinds.assignment + " assignments)" : ""}\n  data addresses seen: ${(c.calls || []).length ? [...new Set(c.calls)].slice(0, 4).map((u) => u.replace(/^https?:\/\/[^/]+/, "").slice(0, 90)).join(" , ") : "none"}\n  ${c.note ? "note: " + c.note + "\n  " : ""}${(c.rows || []).length ? "" : "page text: " + (c.text || "(empty)")}`).join("\n\n");
}
