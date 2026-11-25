"use client";
import { useEffect, useState } from "react";
import { Ic, Ring, Row, Empty } from "./ui";
import { vstate, byDue, fmt } from "../lib/util";
import { parseImport } from "../lib/importer";

// The one-time, no-install option: run a script in a logged-in BUFS tab, paste the result here.
export function Connect({ a, onClose }) {
  const [txt, setTxt] = useState(""), [msg, setMsg] = useState(null), [script, setScript] = useState(""), [copied, setCopied] = useState(false);
  useEffect(() => { fetch("/api/script").then((r) => r.text()).then(setScript).catch(() => {}); }, []);
  const run = () => {
    const r = parseImport(txt.trim());
    if (r.error) return setMsg({ bad: true, t: r.error });
    if (!r.n) return setMsg({ bad: true, t: "BUFS answered, but no videos were found. " + r.notes.slice(0, 3).join(" | ") });
    a.setImp({ at: r.at, courses: r.courses, meta: r.meta }); setMsg({ t: `Done. ${r.n} videos from ${r.found} of ${r.total} courses.` }); setTimeout(onClose, 1400);
  };
  return (<>
    <div className="ov" onClick={onClose} />
    <div className="modal" role="dialog" aria-label="Connect videos without installing anything">
      <div className="mh"><h2>Manual option (no install)</h2><button className="ibtn" aria-label="Close" onClick={onClose}><Ic n="x" /></button></div>
      <p className="sub">Runs once inside your own logged-in BUFS tab and copies your video progress. Nothing is sent anywhere except into this app.</p>
      <ol className="steps">
        <li><b>Copy the script.</b> <button className="btn pri sm" disabled={!script} onClick={() => { navigator.clipboard.writeText(script); setCopied(true); }}><Ic n="copy" s={16} />{copied ? "Copied" : "Copy script"}</button></li>
        <li><b>Run it on BUFS.</b> Open any page of canvas.bufs.ac.kr, press <kbd>F12</kbd> (Mac: <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>J</kbd>), open Console, paste and press Enter. If Chrome asks, type <code>allow pasting</code> first. It takes about a minute and ends with "Copied".</li>
        <li><b>Paste the result here.</b><textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Paste here (Cmd+V)" rows={4} /></li>
      </ol>
      {msg && <div className={msg.bad ? "err" : "okmsg"} role="status">{msg.t}</div>}
      <button className="btn pri wide" onClick={run} disabled={!txt.trim()}>Import my videos</button>
    </div></>);
}

// Shows whether the connector extension is installed, and installs / syncs.
export function Connector({ a }) {
  const { ext, imp } = a;
  if (ext.ready) {
    const p = ext.prog;
    return (
      <div className="card cnr ok"><span className="ib"><Ic n={ext.busy ? "refresh" : "check"} /></span>
        <div className="rb"><b>{ext.busy ? "Reading your Weekly Learning pages..." : "Connector installed"}</b>
          <small>{ext.busy ? `${p?.done ?? 0} of ${p?.total || "?"} courses${p?.course ? " · " + p.course : ""}` : ext.msg || (imp ? `Last synced ${fmt(imp.at)}` : "Press Sync to read your videos from BUFS.")}</small>
          {ext.busy && <span className="bar"><u style={{ width: (p?.total ? (p.done / p.total) * 100 : 5) + "%" }} /></span>}</div>
        <button className="btn pri sm" onClick={a.syncVideos} disabled={ext.busy}><Ic n="refresh" s={16} />{ext.busy ? "Syncing..." : "Sync videos now"}</button>
        {ext.diag && !ext.busy && <button className="btn ghost sm" onClick={() => navigator.clipboard.writeText(ext.diag)}>Copy diagnostics</button>}
      </div>);
  }
  return (
    <div className="card conn"><span className="ib"><Ic n="play" s={26} /></span>
      <div><h3>Connect your BUFS videos (one time, about a minute)</h3>
        <p>BUFS only shows video progress inside its own website, so a small Chrome extension, the connector, reads it for you. It runs only on your computer and only reads your own BUFS pages.</p>
        <ol className="steps">
          <li>In Chrome, open <code>chrome://extensions</code> and switch on <b>Developer mode</b> (top right).</li>
          <li>Click <b>Load unpacked</b> and choose the <b>extension</b> folder inside your <b>canvas-hub</b> folder.</li>
          <li>Reload this page. This card turns green and your videos sync by themselves.</li>
        </ol>
        <div className="btns"><button className="btn pri" onClick={() => location.reload()}>I installed it, reload</button>
          <button className="btn ghost" onClick={() => navigator.clipboard.writeText("chrome://extensions")}><Ic n="copy" s={16} />Copy chrome://extensions</button>
          <button className="link" onClick={() => a.setConnect(true)}>No install? Manual option</button></div></div></div>);
}

const wnum = (w) => parseInt((String(w).match(/\d+/) || [0])[0]);
// The videos of ONE course: only real lecture videos, grouped by week.
export function VideoBoard({ a, course }) {
  const all = a.vids.filter((x) => x.c === course), [flt, setFlt] = useState("all"), m = a.imp?.meta?.[course.id];
  const cnt = { done: 0, todo: 0, missed: 0 }; all.forEach((x) => { const s = vstate(x); if (cnt[s] != null) cnt[s]++; });
  const shown = all.filter((x) => flt === "all" || vstate(x) === flt || (flt === "todo" && vstate(x) === "locked"));
  const weeks = [...new Set(shown.map((x) => x.l.week))].sort((p, q) => wnum(p) - wnum(q));
  return (<>
    {!a.data.demo && <Connector a={a} />}
    {!all.length ? <Empty icon="play" title={a.ext.ready || a.imp ? "No lecture videos in this course" : "Videos are not connected yet"} text={m ? "BUFS Planner read this course's Weekly Learning page and found no lecture videos. Files and assignments are not shown here." : "Connect above, then your lecture videos appear here."} /> : <>
      <div className="vk">
        <div className="card"><Ring pct={cnt.done / all.length} size={84} stroke={11} color="#12c28a"><b>{Math.round((cnt.done / all.length) * 100)}%</b></Ring><div><b>{cnt.done}</b><span>Complete</span></div></div>
        <div className="card ok"><span className="ib"><Ic n="play" s={22} /></span><div><b>{cnt.todo}</b><span>Still to watch</span></div></div>
        <div className="card late"><span className="ib"><Ic n="alert" s={22} /></span><div><b>{cnt.missed}</b><span>Attendance missed</span></div></div>
      </div>
      <div className="fl">{[["all", "All"], ["todo", "To watch"], ["missed", "Missed"], ["done", "Complete"]].map(([k, l]) => <button key={k} aria-pressed={flt === k} onClick={() => setFlt(k)}>{l} <i>{k === "all" ? all.length : k === "todo" ? cnt.todo : cnt[k]}</i></button>)}
        {m && <span className="stamp">{m.videos} lecture videos read{m.other ? `, ${m.other} files and assignments ignored` : ""}</span>}</div>
      {!shown.length && <Empty title="Nothing here" text="No videos match this filter." />}
      {weeks.map((w) => { const W = shown.filter((x) => x.l.week === w).sort((p, q) => (p.l.lesson || 0) - (q.l.lesson || 0) || byDue(p, q)), d = W.filter((x) => x.done).length; return (
        <details className="vwk" key={w} open={d < W.length}><summary><span>{w}</span><small>{d} of {W.length} complete</small><span className="dots">{W.map((x) => <i key={x.id} className={vstate(x)} />)}</span><Ic n="chev" s={18} /></summary>
          {W.map((x) => <Row key={x.id} x={x} course={false} onPick={() => a.setPick(x)} />)}</details>); })}
    </>}
  </>);
}
