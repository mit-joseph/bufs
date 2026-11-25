"use client";
import { Ic, Ring, Row, Empty } from "./ui";
import { fmt } from "../lib/util";
import { VideoBoard } from "./Videos";

export default function Courses({ a }) {
  const { courses, cid, tab, setTab, items, news, upcoming, tasks, vids, colorOf, go, setPick } = a;
  const course = courses.find((c) => c.id === cid);
  if (!course) return (<>
    <h1 className="pt">Courses</h1><p className="sub">{courses.length} active this semester. Open one to see its assignments, videos and announcements.</p>
    <div className="cg">{courses.map((c, k) => { const t = tasks.filter((x) => x.c === c), d = t.filter((x) => x.done).length, v = vids.filter((x) => x.c === c), vd = v.filter((x) => x.done).length, pct = t.length ? d / t.length : 0; return (
      <button key={c.id} className="cc card rise" style={{ "--c": colorOf(c), "--i": k }} onClick={() => go("courses", c.id)}>
        <div className="cch"><h3>{c.name}</h3><span>{c.score != null ? `Grade ${c.score}%` : "No grade yet"}</span></div>
        <div className="ccr"><Ring pct={pct} size={78} stroke={9} color="var(--c)"><b>{Math.round(pct * 100)}%</b></Ring>
          <div className="ccm"><div><b>{upcoming.filter((x) => x.c === c).length}</b><span>coming up</span></div><div><b>{d}/{t.length}</b><span>tasks done</span></div><div><b>{v.length ? `${vd}/${v.length}` : "-"}</b><span>videos</span></div></div></div></button>); })}</div></>);
  const ci = items.filter((x) => x.c === course && (x.k !== "lecture" || x.due)), cn = news.filter((x) => x.c === course), v = vids.filter((x) => x.c === course), t = tasks.filter((x) => x.c === course);
  return (<>
    <button className="btn ghost sm" onClick={() => go("courses")}><Ic n="left" s={16} />All courses</button>
    <div className="chd card" style={{ "--c": colorOf(course) }}><div><h1>{course.name}</h1><p>{course.term}{course.score != null ? ` · Grade ${course.score}%` : ""}</p></div>
      <div className="rings"><div><Ring pct={t.length ? t.filter((x) => x.done).length / t.length : 0} size={70} stroke={9} color="var(--c)"><b>{t.filter((x) => x.done).length}/{t.length}</b></Ring><span>Tasks</span></div>
        <div><Ring pct={v.length ? v.filter((x) => x.done).length / v.length : 0} size={70} stroke={9} color="var(--mint)"><b>{v.length ? `${v.filter((x) => x.done).length}/${v.length}` : "-"}</b></Ring><span>Videos</span></div></div></div>
    <div className="tabs" role="tablist">{[["all", `Coursework (${ci.length})`], ["videos", `Videos (${v.length})`], ["news", `Announcements (${cn.length})`]].map(([i, l]) => <button key={i} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>{l}</button>)}</div>
    {tab === "all" && (ci.length ? [...ci].sort((x, y) => (x.due ? +new Date(x.due) : 9e15) - (y.due ? +new Date(y.due) : 9e15)).map((x) => <Row key={x.id} x={x} course={false} onPick={() => setPick(x)} />) : <Empty title="No coursework with a deadline" text="This course has no assignments, quizzes or events right now." />)}
    {tab === "videos" && <VideoBoard a={a} course={course} />}
    {tab === "news" && (cn.length ? cn.map((x) => <button key={x.id} className="row ok" onClick={() => setPick(x)}><span className="ib" style={{ background: "#f59e0b" }}><Ic n="mega" /></span><span className="rb"><b>{x.title}</b><small>{fmt(x.n.at)}</small></span><span /></button>) : <Empty icon="mega" title="No announcements" />)}
  </>);
}
