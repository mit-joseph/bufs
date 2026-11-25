"use client";
import { Ic, Row } from "./ui";
import { F, dkey, tone, byDue, KIND } from "../lib/util";

export default function CalendarView({ a }) {
  const { items, cur, setCur, day, setDay, setPick } = a;
  const todayK = dkey(new Date().toISOString()), byDay = {};
  items.forEach((x) => { if (x.due) (byDay[dkey(x.due)] ||= []).push(x); });
  const lead = (new Date(Date.UTC(cur.y, cur.m, 1)).getUTCDay() + 6) % 7, dim = new Date(Date.UTC(cur.y, cur.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)], ck = (d) => `${cur.y}-${String(cur.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const mv = (n) => setCur(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const list = [...(byDay[day] || [])].sort(byDue);
  return (
    <div className="cal">
      <section className="card calc">
        <div className="ch"><h1 className="pt">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(cur.y, cur.m, 1))}</h1>
          <button className="ibtn" aria-label="Previous month" onClick={() => mv(-1)}><Ic n="left" /></button>
          <button className="btn ghost sm" onClick={() => { const n = new Date(); setCur({ y: n.getFullYear(), m: n.getMonth() }); setDay(todayK); }}>Today</button>
          <button className="ibtn" aria-label="Next month" onClick={() => mv(1)}><Ic n="right" /></button></div>
        <div className="grid">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div className="dow" key={d}>{d}</div>)}
          {cells.map((d, i) => { if (!d) return <div key={i} className="cell off" />; const k = ck(d), L = [...(byDay[k] || [])].sort(byDue); return (
            <button key={i} style={{ "--h": Math.min(4, L.filter((x) => !x.done).length) }} className={"cell" + (k === todayK ? " td" : "") + (L.length ? " has" : "") + (k < todayK ? " past" : "")} aria-current={k === day} onClick={() => setDay(k)}><span className="dn">{d}</span>
              {L.slice(0, 2).map((x) => <span key={x.id} className={"chip " + tone(x)}><Ic n={x.done ? "tick" : KIND[x.k][2]} s={12} /><span>{x.title}</span></span>)}{L.length > 2 && <span className="more">+{L.length - 2} more</span>}</button>); })}</div>
        <div className="lgd"><span className="late">Overdue</span><span className="hot">Within a day</span><span className="soon">Within 3 days</span><span className="ok">Later</span><span className="done">Done (crossed out)</span></div>
      </section>
      <aside className="card dp"><div className="big">{Number(day.slice(8))}</div><h2>{F(day + "T12:00:00+09:00", { weekday: "long" })} · {F(day + "T12:00:00+09:00", { month: "long", year: "numeric" })}</h2>
        {list.length ? list.map((x) => <Row key={x.id} x={x} onPick={() => setPick(x)} />) : <div className="empty"><b>Nothing on this day</b><p>Enjoy it.</p></div>}</aside>
    </div>
  );
}
