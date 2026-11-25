"use client";
import { useEffect } from "react";
import { Ic } from "./ui";
import { KIND, fmt, tone, label, abs, mmss } from "../lib/util";

export default function Drawer({ x, onClose, onAI }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  const [name, col, ic] = KIND[x.k], body = x.a?.desc || x.n?.body || x.e?.desc || "", link = abs(x.a?.url || x.l?.url) || (x.k === "lecture" ? x.c.url : null), v = x.l;
  return (<>
    <div className="ov" onClick={onClose} />
    <aside className="dr" aria-label="Details">
      <div className="dh"><span className="ib" style={{ background: col }}><Ic n={ic} /></span><span>{name} · {x.c.name}</span><button className="ibtn" aria-label="Close" onClick={onClose}><Ic n="x" /></button></div>
      <h1>{x.title}</h1>
      <div className="facts">
        {x.k !== "news" && <div className={tone(x)}><b style={{ color: "var(--tt)" }}>{label(x)}</b><span>status</span></div>}
        {x.due && <div><b>{fmt(x.due)}</b><span>{x.k === "event" ? "starts" : "due"}</span></div>}
        {x.pts != null && <div><b>{x.pts}</b><span>points</span></div>}
        {x.n && <div><b>{fmt(x.n.at)}</b><span>posted</span></div>}
        {v?.week && <div><b>{v.week}{v.lesson ? ` · Lesson ${v.lesson}` : ""}</b><span>week</span></div>}
        {v?.secs && <div><b>{mmss(v.secs)}</b><span>length</span></div>}
        {v?.att && <div><b>Counts</b><span>for attendance</span></div>}
        {x.e?.loc && <div><b>{x.e.loc}</b><span>place</span></div>}
      </div>
      {body ? <div className="prose" dangerouslySetInnerHTML={{ __html: body }} /> : <p className="sub">{x.k === "quiz" ? "Canvas shows quiz questions only when you start it." : x.k === "lecture" ? "Open the lesson in Canvas to watch it." : "No description was written for this one."}</p>}
      <div className="acts">
        {x.a && !x.done && <button className="btn pri" onClick={() => onAI(x)}><Ic n="spark" s={18} />Ask AI about this</button>}
        {link && <a className="btn ghost" href={link} target="_blank" rel="noreferrer">{x.a ? "Open in Canvas to submit" : x.k === "lecture" ? "Open lesson in Canvas" : "Open in Canvas"}</a>}
      </div>
    </aside></>);
}
