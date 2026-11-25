"use client";
import { useState } from "react";
import { Ic, Row, Orb, Num } from "./ui";
import { F, dkey, left, fmt, tone, label, KIND, streamAI, ms, byDue, vstate } from "../lib/util";

function Setup({ a }) {
  const { data, vids, st, aiReady, go } = a;
  if (data.demo) return null;
  const steps = [["Signed in to BUFS", true, null], ["Videos connected (open a course)", vids.length > 0, () => go("courses")], ["Reminders turned on", st.on, () => go("reminders")], [aiReady === false ? "AI coach needs your Gemini keys in .env.local" : "AI coach ready", aiReady === true, null]];
  const n = steps.filter((s) => s[1]).length; if (n === steps.length) return null;
  return (<div className="card rise"><div className="ch2"><h2>Get set up</h2><span>{n} of {steps.length} done</span></div><span className="bar"><u style={{ width: (n / steps.length) * 100 + "%" }} /></span>
    {steps.map(([t, ok, f]) => <button key={t} className={"stp" + (ok ? " ok" : "")} onClick={f || undefined} disabled={ok || !f}><i>{ok && <Ic n="tick" s={14} />}</i><span>{t}</span>{!ok && f && <small>Set up</small>}{!ok && !f && <small>Needs keys</small>}</button>)}</div>);
}
function Plan({ a }) {
  const [txt, setTxt] = useState(""), [busy, setBusy] = useState(false);
  async function plan() { setBusy(true); setTxt(""); const r = await streamAI({ mode: "fast", messages: [{ role: "user", content: "Plan my day. What should I do first, second and third today? Be brief." }], context: a.getCtx() }, setTxt); if (r.error) setTxt(r.error); setBusy(false); }
  return (<div className="card plan rise" style={{ "--i": 1 }}><div className="planh"><Orb s={52} busy={busy} /><div><h2>AI plan for today</h2><span className="hs">Reads your real deadlines</span></div></div>
    {txt ? <p className="out">{txt}</p> : <p className="hs">One tap and your coach tells you what to do first, second and third.</p>}
    <button className="btn pri wide" onClick={plan} disabled={busy}><Ic n="spark" s={18} />{busy ? "Thinking..." : txt ? "Plan again" : "Plan my day"}</button></div>);
}
// Two concentric rings: tasks submitted (outer) and videos complete (inner).
function Orbit({ tasks, vids, xp, level }) {
  const R = [62, 44], C = R.map((r) => 2 * Math.PI * r), v = [tasks, vids];
  return (<svg className="orbit" viewBox="0 0 150 150" role="img" aria-label={`Tasks ${Math.round(tasks * 100)} percent, videos ${Math.round(vids * 100)} percent`}>
    {R.map((r, i) => <g key={r}><circle cx="75" cy="75" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="11" /><circle cx="75" cy="75" r={r} fill="none" stroke={i ? "var(--mint)" : "var(--brand)"} strokeWidth="11" strokeLinecap="round" strokeDasharray={C[i]} strokeDashoffset={C[i] * (1 - Math.min(1, v[i]))} transform="rotate(-90 75 75)" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} /></g>)}
    <text x="75" y="73" textAnchor="middle" className="ot">Lv {level}</text><text x="75" y="89" textAnchor="middle" className="os2">{xp} XP</text></svg>);
}

export default function Today({ a }) {
  const { upcoming, overdue, items, news, courses, tasks, tasksDone, urgent, week, vids, vidDone, vidTodo, name, hr, setPick, go, colorOf, xp, level } = a;
  const [flt, setFlt] = useState("all");
  const todayK = dkey(new Date().toISOString()), tomK = dkey(new Date(Date.now() + 864e5).toISOString()), now = new Date().toISOString();
  const doable = (x) => x.k !== "event" && (x.k !== "lecture" || x.done === false), focus = upcoming.filter(doable).slice(0, 3);
  const shown = flt === "all" ? upcoming : upcoming.filter((x) => x.k === flt);
  const pick = (x) => <Row key={x.id} x={x} onPick={() => setPick(x)} />;
  const timeline = (list) => [...new Set(list.map((x) => dkey(x.due)))].map((k) => { const L = list.filter((x) => dkey(x.due) === k); return (
    <div key={k}><div className="day"><h3>{k === todayK ? "Today" : k === tomK ? "Tomorrow" : F(L[0].due, { weekday: "long" })}</h3><span>{F(L[0].due, { day: "numeric", month: "long" })}</span><i>{L.length}</i></div>{L.map(pick)}</div>); });
  const days = Array.from({ length: 7 }, (_, i) => { const iso = new Date(Date.now() + i * 864e5).toISOString(), k = dkey(iso); return { k, iso, L: items.filter((x) => x.due && dkey(x.due) === k && !x.done && (x.k !== "lecture" || x.done === false) && vstate(x) !== "locked").sort(byDue) }; });
  const wi = (x) => (<button key={x.id} className={"wi " + tone(x)} onClick={() => setPick(x)}><span className="wt"><Ic n={KIND[x.k][2]} s={12} />{KIND[x.k][0]}</span><b>{x.title}</b><small><i style={{ background: colorOf(x.c) }} />{x.c.name}</small><span className="wm">{F(x.due, { hour: "2-digit", minute: "2-digit" })}</span></button>);
  const kpis = [["hot", "flame", urgent, "Due in 24 hours"], ["soon", "clock", week, "Due this week"], ["late", "alert", overdue.length, "Overdue"], ["ok", "play", vidTodo, "Videos to watch"]];
  const head = urgent ? `${urgent} ${urgent > 1 ? "things need" : "thing needs"} you in the next 24 hours.` : overdue.length ? `${overdue.length} overdue ${overdue.length > 1 ? "tasks need" : "task needs"} your attention.` : week ? "Nothing urgent. A good time to get ahead." : "You're all caught up.";
  return (
    <div className="today">
      <header className="th rise">
        <div><p className="eyebrow">{F(now, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>Good {hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening"}{name ? ", " + name : ""}</h1><p className="lede">{head} {tasks.length ? `${tasksDone} of ${tasks.length} assignments submitted` : "No assignments found yet"}{vids.length ? `, ${vidDone} of ${vids.length} videos complete.` : "."}</p></div>
        <div className="btns"><button className="btn pri" onClick={() => go("ai")}><Ic n="spark" s={18} />Ask the AI coach</button><button className="btn ghost" onClick={() => go("calendar")}><Ic n="cal" s={18} />Calendar</button></div>
      </header>
      <div className="g12">
        <section className="card c12 week rise" style={{ "--i": 1 }}>
          <div className="ch2"><div><h2>Your week</h2><span>Everything due in the next 7 days, day by day. Tap an item to open it.</span></div><button className="link s" onClick={() => go("calendar")}>Open calendar</button></div>
          <h3 className="mini">Do these first</h3>
          <div className="fgrid">{focus.length ? focus.map((x, k) => (
            <button key={x.id} className={"fo " + tone(x)} onClick={() => setPick(x)}><span className="rank">{k + 1}</span>
              <span className="rb"><b>{x.title}</b><small>{x.c.name}</small></span><span className="fcd">{left(x.due)}</span></button>)) : <p className="hs">Nothing due soon. Enjoy the free time.</p>}</div>
          <div className="wk7">
            {overdue.length > 0 && <section className="wcol late"><header><b>Overdue</b><i>{overdue.length}</i></header>{overdue.slice(0, 5).map(wi)}{overdue.length > 5 && <p className="wfree">+{overdue.length - 5} more below</p>}</section>}
            {days.map((d) => <section key={d.k} className={"wcol" + (d.k === todayK ? " today" : "")}><header><b>{d.k === todayK ? "Today" : F(d.iso, { weekday: "short" })}</b><span>{F(d.iso, { day: "numeric", month: "short" })}</span>{d.L.length > 0 && <i>{d.L.length}</i>}</header>{d.L.length ? d.L.map(wi) : <p className="wfree">Nothing due</p>}</section>)}
          </div>
        </section>
        {kpis.map(([t, i, n, l], k) => <div key={l} className={"card kpi c3 rise " + t} style={{ "--i": k + 2 }}><span className="ib"><Ic n={i} s={22} /></span><div><b><Num n={n} /></b><span>{l}</span></div></div>)}

        <section className="card c8 tl rise" style={{ "--i": 6 }}>
          <div className="ch2"><h2>Everything due, in order</h2></div>
          <div className="fl">{[["all", "Everything"], ["assignment", "Assignments"], ["quiz", "Quizzes"], ["lecture", "Videos"], ["event", "Events"]].map(([k, l]) => <button key={k} aria-pressed={flt === k} onClick={() => setFlt(k)}>{l} <i>{(k === "all" ? upcoming : upcoming.filter((x) => x.k === k)).length}</i></button>)}</div>
          {overdue.length > 0 && (flt === "all" || flt === "assignment" || flt === "quiz") && <details className="fold late" open><summary>Overdue and not submitted ({overdue.length})</summary>{overdue.filter((x) => flt === "all" || x.k === flt).map(pick)}</details>}
          <div className="rail">{shown.length ? timeline(shown) : <div className="empty"><span className="ib"><Ic n="check" s={24} /></span><b>Nothing coming up here</b><p>Enjoy the free time.</p></div>}</div>
        </section>
        <aside className="c4 stack">
          <Plan a={a} /><Setup a={a} />
          <div className="card rise" style={{ "--i": 7 }}><div className="ch2"><h2>Progress</h2><span>Study level</span></div>
            <div className="orbwrap"><Orbit tasks={tasks.length ? tasksDone / tasks.length : 0} vids={vids.length ? vidDone / vids.length : 0} xp={xp} level={level} />
              <div className="olg"><div><i style={{ background: "var(--brand)" }} /><b>{tasksDone}/{tasks.length}</b><span>Tasks submitted</span></div>
                <div><i style={{ background: "var(--mint)" }} />{vids.length ? <><b>{vidDone}/{vids.length}</b><span>Videos complete</span></> : <button className="link s" onClick={() => go("courses")}>Connect videos</button>}</div></div></div></div>
          <div className="card rise" style={{ "--i": 8 }}><div className="ch2"><h2>Courses</h2><button className="link s" onClick={() => go("courses")}>See all</button></div>
            {courses.map((c) => { const t = tasks.filter((x) => x.c === c), d = t.filter((x) => x.done).length; return (
              <button key={c.id} className="cl" onClick={() => go("courses", c.id)}><i style={{ background: colorOf(c) }} /><span className="rb"><b>{c.name}</b><span className="bar"><u style={{ width: (t.length ? (d / t.length) * 100 : 0) + "%", background: colorOf(c) }} /></span></span><small>{d}/{t.length}</small></button>); })}</div>
          <div className="card rise" style={{ "--i": 9 }}><div className="ch2"><h2>Announcements</h2></div>
            {news.slice(0, 4).map((x) => <button className="mi" key={x.id} onClick={() => setPick(x)}><b>{x.title}</b><small>{x.c.name} · {fmt(x.n.at)}</small></button>)}{!news.length && <p className="hs">No announcements yet.</p>}</div>
        </aside>
      </div>
    </div>
  );
}
