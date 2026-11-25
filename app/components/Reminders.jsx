"use client";
import { Ic } from "./ui";
import { KIND, fmt, label, ms, open, notify } from "../lib/util";

export default function Reminders({ a }) {
  const { st, save, items } = a;
  async function enable() {
    if (typeof Notification === "undefined") return alert("This browser does not support notifications.");
    const p = await Notification.requestPermission(); save({ ...st, on: p === "granted" });
    if (p === "granted") notify("Reminders are on", "You will be warned before every deadline.", "t"); else alert("Notifications are blocked. Allow them for localhost in the browser's site settings.");
  }
  const sched = items.filter((x) => st.kinds[x.k] && open(x) && ms(x) > 0 && (x.k !== "lecture" || x.done === false)).map((x) => { const t = st.leads.map((h) => new Date(x.due) - h * 36e5).filter((t) => t > Date.now()); return t.length ? { x, at: Math.min(...t) } : null; }).filter(Boolean).sort((p, q) => p.at - q.at).slice(0, 8);
  const Sw = ({ on, f, l }) => <button className="sw" role="switch" aria-checked={on} aria-label={l} onClick={f} />;
  return (<>
    <h1 className="pt">Reminders</h1><p className="sub">Get warned before every deadline, so nothing goes unsubmitted.</p>
    <div className="rm"><div className="stack">
      <div className="card pan"><div className="ch2"><h2>1. Turn on notifications</h2></div><button className="btn pri wide" onClick={enable}><Ic n="bell" />{st.on ? "Reminders are on. Send a test" : "Turn on browser reminders"}</button>
        <p className="hs">Browser reminders work while this page is open in a tab.</p></div>
      <div className="card pan"><div className="ch2"><h2>2. What to remind me about</h2></div>{[["assignment", "Assignments"], ["quiz", "Quizzes"], ["lecture", "Videos with a deadline"], ["event", "Class events"]].map(([k, l]) => (
        <div className="tg" key={k}><span className="ib" style={{ background: KIND[k][1] }}><Ic n={KIND[k][2]} /></span><span className="rb"><b>{l}</b></span><Sw on={st.kinds[k]} l={l} f={() => save({ ...st, kinds: { ...st.kinds, [k]: !st.kinds[k] } })} /></div>))}</div>
      <div className="card pan"><div className="ch2"><h2>3. How early</h2></div><div className="leads">{[24, 6, 3, 1].map((h) => <button key={h} aria-pressed={st.leads.includes(h)} onClick={() => save({ ...st, leads: st.leads.includes(h) ? st.leads.filter((x) => x !== h) : [...st.leads, h] })}>{h} hour{h > 1 ? "s" : ""} before</button>)}</div>
        <div className="tg"><span className="rb"><b>Keep nagging me</b><small>Every 30 minutes in the last 3 hours, until you finish. The notification stays until you dismiss it.</small></span><Sw on={st.nag} l="Keep nagging" f={() => save({ ...st, nag: !st.nag })} /></div></div>
    </div><div className="stack">
      <div className="card pan"><div className="ch2"><h2>Next reminders</h2></div>{sched.length ? sched.map(({ x, at }) => <div className="mi" key={x.id}><span className="when">{fmt(new Date(at).toISOString())}</span><b>{x.title}</b><small>{x.c.name} · {KIND[x.k][0]} · {label(x)}</small></div>) : <p className="hs">No reminders scheduled. Turn on a type or a time on the left.</p>}</div>
      <div className="card pan"><div className="ch2"><h2>Channels</h2></div>
        {[["bell", "Browser", st.on ? "On" : "Off"], ["send", "Telegram", "Coming soon"], ["mega", "Email", "Coming soon"]].map(([i, n, s]) => <div className="tg" key={n}><span className="ib" style={{ background: "var(--brand)" }}><Ic n={i} /></span><span className="rb"><b>{n}</b><small>Reminders when this page is closed</small></span><span className={"tagx" + (s === "On" ? " g" : "")}>{s}</span></div>)}</div>
    </div></div></>);
}
