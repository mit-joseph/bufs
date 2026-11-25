"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ic, Orb, Logo } from "./components/ui";
import Login from "./components/Login";
import Today from "./components/Today";
import CalendarView from "./components/CalendarView";
import Courses from "./components/Courses";
import { Connect } from "./components/Videos";
import AIChat from "./components/AIChat";
import Reminders from "./components/Reminders";
import Drawer from "./components/Drawer";
import Palette from "./components/Palette";
import { fromConnector, diagText } from "./lib/importer";
import { api, APP, PAL, DONE, DEF, dkey, fmt, F, left, ms, open, byDue, notify, plain, KIND, vstate } from "./lib/util";

const NAV = [["today", "Today", "sun"], ["calendar", "Calendar", "cal"], ["courses", "Courses", "book"], ["ai", "AI coach", "spark"]];

export default function Page() {
  const [data, setData] = useState(null), [boot, setBoot] = useState(true), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [view, setView] = useState("today"), [cid, setCid] = useState(null), [tab, setTab] = useState("all"), [pick, setPick] = useState(null), [ai, setAi] = useState({ k: 0, init: [] });
  const [cur, setCur] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [day, setDay] = useState(() => dkey(new Date().toISOString())), [st, setSt] = useState(DEF), [imp, setImpS] = useState(null);
  const [ext, setExt] = useState({ ready: false, busy: false, msg: "", prog: null, diag: "" }), [aiReady, setAiReady] = useState(null), autoRef = useRef(false), extTimer = useRef(null);
  const [connect, setConnect] = useState(false), [pal, setPal] = useState(false), [menu, setMenu] = useState(false), [theme, setTheme] = useState("light"), [, tick] = useState(0);

  const sync = useCallback(async (first) => {
    setBusy(true);
    const r = await api("/api/canvas");
    if (r.ok) { setData(r); setErr(""); try { localStorage.setItem("snap", JSON.stringify(r)); } catch {} }
    else if (r.status === 401) { setData(null); try { localStorage.removeItem("snap"); } catch {} if (!first) setErr(r.error); }
    else setErr(r.error || "Could not load your data.");
    setBusy(false); setBoot(false);
  }, []);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("settings") || "{}"); setSt({ ...DEF, ...s, kinds: { ...DEF.kinds, ...s.kinds } });
      setImpS(JSON.parse(localStorage.getItem("vimport") || "null")); setTheme(document.documentElement.dataset.theme || "light");
      const snap = localStorage.getItem("snap"); if (snap) { setData(JSON.parse(snap)); setBoot(false); }
    } catch {}
    sync(true);
  }, [sync]);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 60000); return () => clearInterval(i); }, []);
  useEffect(() => { if (!data) return; const i = setInterval(() => sync(false), 6e5); return () => clearInterval(i); }, [Boolean(data), sync]);
  useEffect(() => { const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((p) => !p); } }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  // Talks to the BUFS Planner Connector extension (if installed) through the page.
  useEffect(() => {
    const h = (e) => {
      if (e.source !== window || e.origin !== location.origin || e.data?.source !== "bufs-ext") return;
      const m = e.data;
      if (m.type === "pong") setExt((x) => ({ ...x, ready: true }));
      else if (m.type === "progress") setExt((x) => ({ ...x, busy: true, prog: { done: m.done, total: m.total, course: m.course } }));
      else if (m.type === "error") { clearTimeout(extTimer.current); setExt((x) => ({ ...x, busy: false, prog: null, msg: String(m.error || "Sync failed.") })); }
      else if (m.type === "result") {
        clearTimeout(extTimer.current); const r = fromConnector(m.result);
        if (r.n) setImp({ at: r.at, courses: r.courses, meta: r.meta });
        setExt((x) => ({ ...x, busy: false, prog: null, diag: diagText(m.result), msg: r.n ? `Synced ${r.n} videos from ${r.found} of ${r.total} courses.` : "The connector ran but found no videos. Press Copy diagnostics and send it to me." }));
      }
    };
    addEventListener("message", h); postMessage({ source: "bufs-planner", type: "ping" }, location.origin);
    return () => removeEventListener("message", h);
  }, []);
  const syncVideos = useCallback(() => {
    setExt((x) => ({ ...x, busy: true, msg: "", prog: { done: 0, total: 0 } }));
    clearTimeout(extTimer.current); extTimer.current = setTimeout(() => setExt((x) => ({ ...x, busy: false, prog: null, msg: "The connector did not answer. Reload this page and try again." })), 4 * 60 * 1000);
    postMessage({ source: "bufs-planner", type: "sync" }, location.origin);
  }, []);
  useEffect(() => { if (!data || data.demo || !ext.ready || autoRef.current) return; autoRef.current = true; if (!(imp && Date.now() - new Date(imp.at) < 30 * 6e4)) syncVideos(); }, [data, ext.ready, imp, syncVideos]);
  // Warms up the AI route and checks that the keys work, so the first answer is not slow.
  useEffect(() => { if (!data) return; fetch("/api/ai").then((r) => r.json()).then((j) => setAiReady(!!j.ready)).catch(() => setAiReady(false)); }, [Boolean(data)]);
  const navRef = useRef(null);
  useEffect(() => { // slides the highlight under the active menu item
    const place = () => { const n = navRef.current, el = n && n.querySelector('[aria-current="true"]'); if (!n) return; n.style.setProperty("--x", (el ? el.offsetLeft : 0) + "px"); n.style.setProperty("--w", (el ? el.offsetWidth : 0) + "px"); };
    place(); const t = setTimeout(place, 350); addEventListener("resize", place);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null; if (ro && navRef.current) { ro.observe(navRef.current); navRef.current.querySelectorAll("button").forEach((b) => ro.observe(b)); }
    return () => { clearTimeout(t); removeEventListener("resize", place); ro && ro.disconnect(); };
  }, [view, data]);
  useEffect(() => { // soft light that follows the pointer over cards
    const m = (e) => { const c = e.target.closest && e.target.closest(".card,.row,.fo"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); };
    addEventListener("pointermove", m, { passive: true }); return () => removeEventListener("pointermove", m);
  }, []);
  const save = (n) => { setSt(n); try { localStorage.setItem("settings", JSON.stringify(n)); } catch {} };
  const setImp = (v) => { setImpS(v); try { localStorage.setItem("vimport", JSON.stringify(v)); } catch {} };
  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); document.documentElement.dataset.theme = t; try { localStorage.setItem("theme", t); } catch {} };

  async function signIn(kind, payload) {
    setBusy(true); setErr("");
    const r = await api(kind === "id" ? "/api/login" : "/api/token", payload);
    if (!r.ok) { setErr(r.error || "Sign-in failed."); setBusy(false); return; }
    await sync(false);
  }
  async function demo() {
    setBusy(true); setErr("");
    const r = await api("/api/demo");
    if (!r.ok) { setErr(r.error || "Sample data is not available."); setBusy(false); return; }
    await sync(false);
  }
  async function signOut() {
    await api("/api/logout");
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    setData(null); setPick(null); setView("today"); setCid(null); setSt(DEF); setImpS(null); setAi({ k: 0, init: [] }); setErr(""); setMenu(false); autoRef.current = false; setExt((x) => ({ ...x, busy: false, msg: "", prog: null, diag: "" })); setAiReady(null);
    const t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; document.documentElement.dataset.theme = t; setTheme(t);
  }

  const courses = data?.courses || [], colorOf = (c) => PAL[courses.indexOf(c) % PAL.length];
  const items = useMemo(() => courses.flatMap((c) => {
    const src = c.lx.items.length ? c.lx.items : imp?.courses?.[c.id] || [];
    return [
      ...c.assignments.map((x) => ({ k: x.isQuiz ? "quiz" : "assignment", id: `a${c.id}-${x.id}`, c, title: x.name, due: x.due, done: DONE.includes(x.state), pts: x.points, score: x.score, a: x })),
      ...src.map((l) => ({ k: "lecture", id: `l${c.id}-${l.id}`, c, title: l.title, due: l.due, unlock: l.unlock, done: l.done, pct: l.pct, l })),
      ...c.events.map((e) => ({ k: "event", id: `e${c.id}-${e.id}`, c, title: e.title, due: e.start, done: false, e })),
    ];
  }), [data, imp]);
  const news = useMemo(() => courses.flatMap((c) => c.announcements.map((n) => ({ k: "news", id: `n${c.id}-${n.id}`, c, title: n.title, n }))).sort((p, q) => new Date(q.n.at) - new Date(p.n.at)), [data]);
  const vids = items.filter((x) => x.k === "lecture"), live = (p) => items.find((i) => i.id === p.id) || p;
  const todo = (x) => x.k !== "event" && (x.k !== "lecture" || x.done === false);
  const upcoming = items.filter((x) => open(x) && ms(x) > 0 && vstate(x) !== "locked").sort(byDue);
  const overdue = items.filter((x) => open(x) && ms(x) <= 0 && x.k !== "event" && x.k !== "lecture").sort((p, q) => byDue(q, p));
  const tasks = items.filter((x) => x.k === "assignment" || x.k === "quiz"), tasksDone = tasks.filter((x) => x.done).length;
  const urgent = upcoming.filter((x) => ms(x) < 864e5 && todo(x)).length, week = upcoming.filter((x) => ms(x) < 7 * 864e5 && todo(x)).length;
  const vidDone = vids.filter((x) => x.done).length, vidTodo = vids.filter((x) => vstate(x) === "todo").length;
  const xp = tasksDone * 20 + vidDone * 10, level = Math.floor(Math.sqrt(xp / 15)) + 1, lvPct = (xp - 15 * (level - 1) ** 2) / (15 * level ** 2 - 15 * (level - 1) ** 2);
  const pool = tasks.filter((x) => !x.done).sort((p, q) => (p.due ? +new Date(p.due) : 9e15) - (q.due ? +new Date(q.due) : 9e15));
  const hr = Number(F(new Date().toISOString(), { hour: "2-digit", hour12: false })), name = (data?.me?.name || "").split(" ")[0];

  function getCtx() {
    const t = (x) => `[${x.c.name}] ${x.title}`, when = (x) => (x.due ? `${fmt(x.due)} (${ms(x) < 0 ? left(x.due) + " ago" : "in " + left(x.due)})` : "no date");
    const hint = (x) => { const d = plain(x.a?.desc || x.e?.desc || ""); return d ? " | " + d.slice(0, 120) : ""; };
    const toWatch = vids.filter((x) => vstate(x) === "todo").sort(byDue).slice(0, 15), missed = vids.filter((x) => vstate(x) === "missed");
    return [
      `Now: ${fmt(new Date().toISOString())} (Seoul time)`,
      "OVERDUE assignments/quizzes:\n" + (overdue.slice(0, 10).map((x) => `- ${t(x)} (${KIND[x.k][0]}) was due ${when(x)}`).join("\n") || "none"),
      "UPCOMING assignments, quizzes, events:\n" + (upcoming.filter((x) => x.k !== "lecture").slice(0, 18).map((x) => `- ${t(x)} (${KIND[x.k][0]}${x.pts != null ? ", " + x.pts + " pts" : ""}) due ${when(x)}${hint(x)}`).join("\n") || "none"),
      "VIDEOS NOT WATCHED yet:\n" + (toWatch.map((x) => `- ${t(x)} (${x.l.week}${x.l.lesson ? ", lesson " + x.l.lesson : ""}) ${x.due ? "due " + when(x) : ""}${x.pct ? ", " + x.pct + "% watched" : ""}`).join("\n") || (vids.length ? "none" : "video status not connected")),
      "MISSED VIDEOS (closed, not watched): " + (missed.length ? missed.length + ": " + missed.slice(0, 5).map(t).join("; ") : "none"),
      "PROGRESS: " + `${tasksDone}/${tasks.length} tasks submitted` + (vids.length ? `; ${vidDone}/${vids.length} videos complete` : ""),
      "GRADES: " + courses.map((c) => `${c.name}: ${c.score != null ? c.score + "%" : "n/a"}`).join("; "),
      "LATEST ANNOUNCEMENTS:\n" + (news.slice(0, 4).map((x) => `- [${x.c.name}] ${x.title} (${fmt(x.n.at)}): ${plain(x.n.body).slice(0, 160)}`).join("\n") || "none"),
    ].join("\n\n").slice(0, 7500);
  }

  useEffect(() => { document.title = (urgent ? `(${urgent}) ` : "") + APP.name; }, [urgent]);
  useEffect(() => {
    if (!data || !st.on || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const run = () => {
      const seen = JSON.parse(localStorage.getItem("seen") || "{}"), t = Date.now(); let ch = false;
      items.forEach((x) => {
        if (!st.kinds[x.k] || !open(x) || (x.k === "lecture" && x.done !== false)) return; const m = new Date(x.due) - t; if (m < 0) return;
        const hs = st.leads.filter((h) => m <= h * 36e5), h = hs.length ? Math.min(...hs) : null, k = `${x.id}-${h}`;
        if (h !== null && !seen[k]) { seen[k] = 1; ch = true; notify(`${x.title} ${x.k === "event" ? "starts" : "is due"} in ${left(x.due)}`, `${x.c.name}. ${x.k === "lecture" ? "Watch it now." : "Don't leave it for later."}`, k); }
        if (st.nag && m <= 3 * 36e5 && x.k !== "event") { const n = `${x.id}-n${Math.floor(t / 18e5)}`; if (!seen[n]) { seen[n] = 1; ch = true; notify(`Still not done: ${x.title}`, `${left(x.due)} left. Do it now.`, n); } }
      });
      if (ch) localStorage.setItem("seen", JSON.stringify(seen));
    };
    run(); const i = setInterval(run, 6e4); return () => clearInterval(i);
  }, [data, st, items]);

  if (!data) return boot ? <div className="splash"><Logo /><p>Loading BUFS Planner...</p></div> : <Login onAuth={signIn} onDemo={demo} busy={busy} err={err} />;

  const go = (v, id = null) => { setView(v); setCid(id); setTab("all"); window.scrollTo(0, 0); };
  const openDay = (k) => { setDay(k); setCur({ y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1 }); go("calendar"); };
  const openAI = (x) => { setPick(null); setAi({ k: ai.k + 1, init: [x.id] }); go("ai"); };
  const a = { data, courses, items, news, vids, upcoming, overdue, tasks, tasksDone, urgent, week, vidDone, vidTodo, pool, colorOf, setPick, go, openDay, name, hr, cur, setCur, day, setDay, st, save, imp, setImp, setConnect, cid, tab, setTab, ext, syncVideos, getCtx, aiReady, xp, level };
  const seenTxt = `${tasks.length} tasks · ${vids.length} videos · ${news.length} announcements`;

  return (<>
    <header className="hd"><div className="in">
      <Logo />
      <nav className="nav" aria-label="Main" ref={navRef}><i className="ind" />{NAV.map(([v, l, i]) => <button key={v} aria-current={view === v} aria-label={l} title={l} onClick={() => go(v)}><Ic n={i} s={18} /><span>{l}</span></button>)}</nav>
      <div className="tools">
        <div className="lvl" title="20 XP for each submitted task, 10 for each completed video"><Ic n="bolt" s={14} /><b>Lv {level}</b><span className="bar"><u style={{ width: Math.max(4, lvPct * 100) + "%" }} /></span><small>{xp} XP</small></div>
        <button className="srch" onClick={() => setPal(true)} aria-label="Search"><Ic n="search" s={16} /><span>Search</span><kbd>Ctrl K</kbd></button>
        {ext.busy && <span className="sync"><i />Videos {ext.prog?.done ?? 0}/{ext.prog?.total || "?"}</span>}{busy && !ext.busy && <span className="sync"><i />Syncing</span>}
        <button className="ibtn" aria-label="Refresh data" title="Refresh data" onClick={() => sync(false)} disabled={busy}><Ic n="refresh" s={18} /></button>
        <button className="ibtn" aria-label="Switch light or dark" title="Light / dark" onClick={toggleTheme}><Ic n={theme === "dark" ? "sun" : "moon"} s={18} /></button>
        <button className="ibtn bell" aria-label="Reminders" title="Reminders" onClick={() => go("reminders")}><Ic n="bell" s={18} />{urgent > 0 && <i className="dot">{urgent}</i>}</button>
        <div className="menuw"><button className="avatar" onClick={() => setMenu(!menu)} aria-label="Account menu">{(name || "S")[0]}</button>
          {menu && <><div className="ov0" onClick={() => setMenu(false)} /><div className="menu">
            <div className="mn"><b>{name || "Student"}</b><small>{data.demo ? "Sample data" : "BUFS Canvas"}</small></div>
            <button onClick={() => { setMenu(false); go("reminders"); }}><Ic n="bell" s={16} />Reminders</button>
            <button onClick={() => { setMenu(false); setConnect(true); }}><Ic n="play" s={16} />Connect videos (manual)</button>
            <button onClick={signOut}><Ic n="out" s={16} />Sign out</button></div></>}</div>
      </div></div></header>
    <main className="wrap">
      {data.demo && <div className="banner info">You are viewing sample data. Sign out to use your own BUFS account.</div>}
      {err && <div className="banner" role="alert">{err}</div>}
      <div className="page" key={view}>
      {view === "today" && <Today a={a} />}
      {view === "calendar" && <CalendarView a={a} />}
      {view === "courses" && <Courses a={a} />}
      {view === "ai" && <AIChat key={ai.k} pool={pool} initial={ai.init} getCtx={getCtx} seen={seenTxt} />}
      {view === "reminders" && <Reminders a={a} />}
      </div>
    </main>
    {view !== "ai" && <button className="fab" onClick={() => go("ai")} aria-label="Ask the AI coach" title="Ask the AI coach"><Orb s={44} /><span>Ask AI</span></button>}
    {pick && <Drawer x={live(pick)} onClose={() => setPick(null)} onAI={openAI} />}
    {connect && <Connect a={a} onClose={() => setConnect(false)} />}
    {pal && <Palette a={a} onClose={() => setPal(false)} />}
  </>);
}
