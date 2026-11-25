"use client";
import { useEffect, useRef, useState } from "react";
import { Ic } from "./ui";
import { KIND, fmt, label } from "../lib/util";

export default function Palette({ a, onClose }) {
  const [q, setQ] = useState(""), ref = useRef(null);
  useEffect(() => { ref.current?.focus(); const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  const k = q.trim().toLowerCase(), res = (k ? [...a.items, ...a.news].filter((x) => (x.title + " " + x.c.name).toLowerCase().includes(k)) : a.upcoming.slice(0, 8)).slice(0, 9);
  return (<>
    <div className="ov" onClick={onClose} />
    <div className="pal" role="dialog" aria-label="Search">
      <div className="pali"><Ic n="search" /><input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments, videos, announcements..." aria-label="Search" /><kbd>Esc</kbd></div>
      <div className="prs">{!k && <p className="cn">Coming up</p>}{res.map((x) => (
        <button className="pr" key={x.id} onClick={() => { a.setPick(x); onClose(); }}><span className="ib" style={{ background: KIND[x.k][1] }}><Ic n={KIND[x.k][2]} s={18} /></span>
          <span className="rb"><b>{x.title}</b><small>{x.c.name} · {KIND[x.k][0]}</small></span><span className="pl">{x.n ? fmt(x.n.at) : label(x)}</span></button>))}
        {k && !res.length && <p className="hs" style={{ padding: 16 }}>No results for "{q}".</p>}</div>
    </div></>);
}
