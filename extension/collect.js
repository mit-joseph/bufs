/* BUFS Planner connector: shared page readers. Every function is self-contained because it is injected into BUFS pages. */

// Opens collapsed week sections so their lessons are present in the page.
function bufsExpand(doc) {
  doc = doc || document; var n = 0;
  try { doc.querySelectorAll('[aria-expanded="false"]').forEach(function (el) { if (n < 60 && /^(\d+\s*주차|Week\s*\d+)/i.test((el.textContent || "").trim())) { el.click(); n++; } }); } catch (e) {}
  try { doc.querySelectorAll("details:not([open])").forEach(function (d) { d.open = true; }); } catch (e) {}
  return n;
}

// Reads the VIDEO rows of a Weekly Learning page.
// Every row on that page ends with a status pill ("Done" or "-"), so the page is cut into rows at those pills. A row is a VIDEO when it has the
// "Week N | Lesson N" tags or a length like 28:41. PDFs, files and assignments (which show "N Points") are counted but never returned.
function bufsReadRows(doc) {
  doc = doc || document;
  var out = { rows: [], kinds: { video: 0, file: 0, assignment: 0 }, calls: [], text: "", tokens: 0 };
  try { out.calls = (doc.defaultView.performance.getEntriesByType("resource") || []).map(function (e) { return e.name; }).filter(function (u) { return /\/learningx\/api\//.test(u); }).slice(-30); } catch (e) {}
  if (!doc.body) return out;
  var T = [], w = doc.createTreeWalker(doc.body, 4), n, i;
  for (n = w.nextNode(); n; n = w.nextNode()) {
    var tag = n.parentElement && n.parentElement.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
    String(n.nodeValue).split("|").forEach(function (p) { var s = p.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(); if (s) T.push(s); });
  }
  out.tokens = T.length;
  var MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  var DATE = "([A-Za-z]{3,9})\\.?\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?\\s*(?:at\\s*)?(\\d{1,2}):(\\d{2})\\s*([AaPp][Mm])?";
  function mkFrom(m) {
    var mo = MON.indexOf(m[1].slice(0, 3).toLowerCase()); if (mo < 0) return null;
    var h = +m[4], ap = (m[6] || "").toLowerCase(); if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    var now = Date.now(), y = m[3] ? +m[3] : new Date().getFullYear(), t = Date.UTC(y, mo, +m[2], h - 9, +m[5]);
    if (!m[3]) { if (t - now > 200 * 864e5) t = Date.UTC(y - 1, mo, +m[2], h - 9, +m[5]); else if (now - t > 250 * 864e5) t = Date.UTC(y + 1, mo, +m[2], h - 9, +m[5]); }
    return new Date(t).toISOString();
  }
  function dateOf(s) { var m = s.match(new RegExp(DATE)); return m ? mkFrom(m) : null; }
  function dateAfter(s, label) { var m = s.match(new RegExp("\\b" + label + "(?:\\s+Date)?\\s*:?\\s*" + DATE, "i")); return m ? mkFrom(m) : null; }
  function durOf(s) { var m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/); if (!m) return null; return m[3] !== undefined ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : (+m[1]) * 60 + (+m[2]); }
  function isDateTok(s) { return /\d{1,2}:\d{2}/.test(s) && dateOf(s) !== null; }
  function isStatus(k) {
    var s = T[k];
    if (/^(Done|완료)\s*[✓✔]?$/i.test(s)) return true;
    if (/^[-—–]$/.test(s)) { var p = T[k - 1] || "", nx = T[k + 1] || ""; return !(isDateTok(p) || /^(Due|End|Start|마감)/i.test(nx)); }
    return false;
  }
  var LAB = /^(Start|Due|End)(\s+Date)?\s*:?\s*$/i, LABDATE = /^(Start|Due|End)(\s+Date)?\s*:?\s+[A-Za-z]{3,9}\.?\s+\d/i;
  function isMeta(t) {
    return LAB.test(t) || LABDATE.test(t) || isDateTok(t) || durOf(t) !== null || /^(Week|Lesson)\s*\d+$/i.test(t) || /^(온라인\s*강좌\s*\d+|Attendance|출석|Closed|종료)$/i.test(t) || /^[-—–]$/.test(t) || /^\d+(\.\d+)?\s*Points?$/i.test(t);
  }
  var kinds = out.kinds, rows = [], seen = {}, headerWeek = null, segs = [], cur = [];
  for (i = 0; i < T.length; i++) { cur.push(T[i]); if (isStatus(i)) { segs.push(cur); cur = []; } }
  segs.forEach(function (seg) {
    seg = seg.filter(function (t) { var h = t.match(/^\W*(\d+)\s*주차$/); if (h) { headerWeek = +h[1]; return false; } return true; });
    if (seg.length < 2) return;
    var stTok = seg[seg.length - 1], body = seg.slice(0, -1), txt = body.join(" "), secs = null, att = false, closed = false;
    body.forEach(function (t) { if (secs === null) { var d = durOf(t); if (d !== null) secs = d; } if (/^(Attendance|출석)$/i.test(t)) att = true; if (/^(Closed|종료)$/i.test(t)) closed = true; });
    var tg = txt.match(/\bWeek\s*(\d+)\s*[|·\-]?\s*Lesson\s*(\d+)\b/i), points = /\b\d+(?:\.\d+)?\s*Points?\b/i.test(txt);
    if (!(tg || (secs !== null && !points))) { if (points || /\bDue\b/i.test(txt)) kinds.assignment++; else kinds.file++; return; }
    kinds.video++;
    var title = ""; for (var b = 0; b < body.length; b++) { if (!isMeta(body[b])) { title = body[b]; break; } }
    var row = { title: title || "Video", week: tg ? +tg[1] : headerWeek, lesson: tg ? +tg[2] : null, start: dateAfter(txt, "Start"), due: dateAfter(txt, "Due"), end: dateAfter(txt, "End"), secs: secs, att: att, closed: closed, done: !/^[-—–]$/.test(stTok) };
    var key = row.week + "|" + row.lesson + "|" + row.title; if (seen[key]) return; seen[key] = 1; rows.push(row);
  });
  if (!segs.length) { // no status pills on this page: fall back to the Week/Lesson tags alone (status unknown)
    for (i = 1; i < T.length; i++) {
      var L = T[i].match(/^Lesson\s*(\d+)$/i), W = L && T[i - 1].match(/^Week\s*(\d+)$/i); if (!W) continue;
      var s0 = i - 2; while (s0 >= 0 && isMeta(T[s0])) s0--;
      var near = T.slice(Math.max(0, i - 12), i).join(" ");
      rows.push({ title: s0 >= 0 ? T[s0] : "Video", week: +W[1], lesson: +L[1], start: dateAfter(near, "Start"), due: dateAfter(near, "Due"), end: dateAfter(near, "End"), secs: T.slice(Math.max(0, i - 12), i).map(durOf).filter(function (d) { return d !== null; })[0] || null, att: false, closed: false, done: null });
      kinds.video++;
    }
  }
  out.rows = rows; out.text = T.slice(0, 40).join(" | ").slice(0, 300);
  return out;
}

// No-install option: runs inside a logged-in BUFS Canvas tab, opens each Weekly Learning page in a hidden frame and reads it.
async function bufsCollectConsole() {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var j = async function (u) { try { var r = await fetch(u, { credentials: "include", headers: { Accept: "application/json" } }), t = await r.text(), d = null; try { d = JSON.parse(t.replace(/^while\(1\);/, "")); } catch (e) {} return { s: r.status, d: d }; } catch (e) { return { s: 0, d: null }; } };
  function scan(win) {
    var res = { rows: [], kinds: { video: 0, file: 0, assignment: 0 }, calls: [], text: "" };
    try {
      var d = win.document; bufsExpand(d); var r = bufsReadRows(d); res.rows = r.rows; res.kinds = r.kinds; res.calls = r.calls; res.text = r.text;
      Array.prototype.forEach.call(d.querySelectorAll("iframe"), function (f) { try { if (f.contentWindow && f.contentDocument) { var s = scan(f.contentWindow); res.rows = res.rows.concat(s.rows); res.calls = res.calls.concat(s.calls); ["video", "file", "assignment"].forEach(function (k) { res.kinds[k] += s.kinds[k]; }); if (!res.text) res.text = s.text; } } catch (e) {} });
    } catch (e) {}
    return res;
  }
  var cr = await j("/api/v1/courses?enrollment_state=active&per_page=100");
  if (!Array.isArray(cr.d)) throw new Error("Open this on a BUFS Canvas page while signed in.");
  var out = { app: "bufs-planner", v: 2, at: new Date().toISOString(), courses: [] };
  var cs = cr.d.filter(function (c) { return c.name && !c.name.startsWith("["); });
  for (var ci = 0; ci < cs.length; ci++) {
    var c = cs[ci], rec = { id: c.id, name: c.name, rows: [], api: [], calls: [], note: "", text: "" };
    var tabs = (await j("/api/v1/courses/" + c.id + "/tabs")).d || [];
    var t = tabs.find(function (x) { return /weekly/i.test(x.label || ""); }) || tabs.find(function (x) { return /learning/i.test(x.label || ""); });
    if (!t) { rec.note = "No Weekly Learning tab"; out.courses.push(rec); continue; }
    var f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-99999px;top:0;width:1300px;height:900px;border:0"; f.src = t.html_url; document.body.appendChild(f);
    await new Promise(function (r) { f.onload = r; setTimeout(r, 20000); });
    var last = -1, stable = 0;
    for (var p = 0; p < 16; p++) {
      await sleep(1800); var res = scan(f.contentWindow); rec.rows = res.rows; rec.kinds = res.kinds; rec.calls = res.calls; rec.text = res.text;
      if (res.rows.length && res.rows.length === last) { if (++stable >= 2) break; } else stable = 0; last = res.rows.length;
    }
    f.remove();
    var urls = rec.calls.filter(function (u, ix, a) { return a.indexOf(u) === ix; }).slice(0, 6);
    for (var ui = 0; ui < urls.length; ui++) { var rr = await j(urls[ui]); if (rr.d) rec.api.push({ url: urls[ui].slice(0, 200), data: rr.d }); }
    console.log(c.name + ": " + rec.rows.length + " videos");
    out.courses.push(rec);
  }
  return out;
}
