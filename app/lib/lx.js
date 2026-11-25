// Reads BUFS's lecture tool (the Weekly Learning page). Keeps ONLY videos and works out Complete / not complete.
const DONE = /^(attendance|late|complete|completed|done|finished|watched|pass|passed|success|true)$/i;
const TODO = /^(absent|none|unwatched|incomplete|not[_ ]?started|fail|failed|false)$/i;
const VIDEO = /movie|video|mp4|mov|webm|youtube|vimeo|stream|screen|everlec|lecture|media|kollus|record|zoom|webex/;
const OTHER = /attach|file|pdf|doc|ppt|hwp|xls|zip|image|text|html|url|link|wiki|page|quiz|assign|discuss|exam|survey|board|note/;
function judge(o) {
  let res = null, pct = null;
  for (const [k, v] of Object.entries(o || {})) {
    if (v == null || typeof v === "object") continue;
    if (/percent|progress|rate/i.test(k) && v !== "" && !isNaN(Number(v))) { const n = Number(v); pct = Math.max(pct ?? 0, Math.round(n > 0 && n <= 1 && String(v).includes(".") ? n * 100 : n)); }
    else if (/status|state|complete/i.test(k)) { const s = String(v); if (DONE.test(s)) res = true; else if (res !== true && TODO.test(s)) res = false; }
  }
  return { res, pct };
}
function isVideo(node, cc) {
  const ct = String(cc.content_type || "").toLowerCase(), ty = String(node.type || node.content_type || "").toLowerCase(), secs = Number(cc.duration || node.duration || 0);
  for (const s of [ct, ty]) { if (!s) continue; if (VIDEO.test(s)) return true; if (OTHER.test(s)) return false; }
  return secs > 0;
}
export function walk(node, week = "", out = []) {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, week, out)); return out; }
  if (!node || typeof node !== "object") return out;
  const title = node.title || node.name || node.module_name || node.week_title || "";
  const cc = node.commons_content || {};
  if (node.component_id !== undefined || node.attendance_status !== undefined || node.commons_content || (node.type && (node.view_url || node.due_at || node.lock_at))) {
    if (!isVideo(node, cc)) return out;
    const a = judge(node), b = judge(cc), pct = Math.max(a.pct ?? -1, b.pct ?? -1), res = a.res ?? b.res ?? (pct >= 0 ? pct >= 100 : null);
    out.push({
      id: String(node.component_id ?? node.id ?? out.length), title: title || "Video", week: week || "Videos", type: String(node.type || cc.content_type || "video").toLowerCase(),
      lesson: node.lesson_position ?? node.lesson_no ?? node.lesson ?? null, att: node.use_attendance === true || node.use_attendance === "true" || node.attendance_status !== undefined,
      secs: Number(cc.duration || node.duration || 0) || null, pct: pct >= 0 ? Math.min(pct, 100) : null,
      due: node.due_at || node.lock_at || node.end_date || cc.due_at || null, unlock: node.unlock_at || null,
      done: node.completed === true ? true : res, url: node.view_url || cc.view_url || node.url || null,
    });
    return out;
  }
  const w = title || week;
  for (const v of Object.values(node)) if (v && typeof v === "object") walk(v, w, out);
  return out;
}
