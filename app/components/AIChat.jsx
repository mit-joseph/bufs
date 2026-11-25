"use client";
import { useEffect, useRef, useState } from "react";
import { Ic, Orb } from "./ui";
import { KIND, fmt, tone, label, plain, streamAI } from "../lib/util";

export default function AIChat({ pool, initial, getCtx, seen }) {
  const [mode, setMode] = useState(() => { try { return localStorage.getItem("aimode") || "fast"; } catch { return "fast"; } }), [msgs, setMsgs] = useState([]), [text, setText] = useState(""), [sel, setSel] = useState(initial), [pk, setPk] = useState(false), [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);
  const chosen = pool.filter((x) => sel.includes(x.id)), tog = (id) => setSel((s) => (s.includes(id) ? s.filter((i) => i !== id) : [...s, id]));
  async function send(t = text) {
    t = t.trim(); if (!t || busy) return;
    const next = [...msgs, { role: "user", content: t }]; setMsgs(next); setText(""); setBusy(true);
    const r = await streamAI({ mode, messages: next, context: getCtx(), attachments: chosen.map((x) => ({ name: x.title, course: x.c.name, due: x.due, points: x.pts, text: plain(x.a?.desc) })) }, (acc) => setMsgs([...next, { role: "assistant", content: acc }]));
    if (r.error) setMsgs([...next, { role: "assistant", content: r.error }]);
    setBusy(false);
  }
  const ideas = chosen.length ? ["Explain what I need to do", "Make a plan to finish before the deadline", "What mistakes should I avoid?"] : ["What do I need to do now?", "Plan my week", "Which video should I watch first?"];
  const courses = [...new Set(pool.map((x) => x.c))], waiting = busy && msgs[msgs.length - 1]?.role === "user";
  return (
    <div className="chat">
      <div className="chh"><div className="cht"><Orb s={56} busy={busy} /><div><h1 className="pt">AI study coach</h1><p className="sub">Reads your live planner, so just ask what to do.</p></div></div><div className="modes" role="group" aria-label="Answer speed"><button aria-pressed={mode === "fast"} onClick={() => { setMode("fast"); try { localStorage.setItem("aimode", "fast"); } catch {} }} title="Short answers, fastest">Fast</button><button aria-pressed={mode === "smart"} onClick={() => { setMode("smart"); try { localStorage.setItem("aimode", "smart"); } catch {} }} title="Longer, more careful answers">Smart</button></div></div>
      <div className="ctxb"><i />Reads your live data: {seen}</div>
      <div className="msgs">
        {!msgs.length && <div className="hi rise"><Orb s={84} /><h2>What are we working on?</h2><p>Ask what to do next, or press Add assignment so I read its instructions too.</p>
          <div className="sg">{ideas.map((i) => <button key={i} onClick={() => send(i)}>{i}</button>)}</div></div>}
        {msgs.map((m, i) => <div key={i} className={"bub " + (m.role === "user" ? "u" : "a")}>{m.content}{busy && i === msgs.length - 1 && m.role === "assistant" && <span className="caret" />}</div>)}
        {waiting && <div className="bub a typing"><i /><i /><i /></div>}<div ref={end} />
      </div>
      <div className="cmp">
        <div className="at">{chosen.map((x) => <span className="atc" key={x.id}>{x.title}<button aria-label="Remove" onClick={() => tog(x.id)}><Ic n="x" s={14} /></button></span>)}
          <button className="btn ghost sm" onClick={() => setPk(true)}><Ic n="plus" s={16} />Add assignment</button></div>
        <div className="ask"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything about your studies" aria-label="Message" />
          <button className="btn pri" onClick={() => send()} disabled={busy}><Ic n="send" s={18} />Send</button></div>
      </div>
      {pk && <><div className="ov" onClick={() => setPk(false)} /><div className="modal" role="dialog" aria-label="Add assignment">
        <div className="mh"><h2>Add an unsubmitted assignment</h2><button className="ibtn" aria-label="Close" onClick={() => setPk(false)}><Ic n="x" /></button></div><p className="sub">Tap one or more. Their instructions are sent to the AI automatically.</p>
        {!pool.length && <p className="hs">Nothing is waiting to be submitted. Great work.</p>}
        {courses.map((c) => <div key={c.id}><div className="cn">{c.name}</div>{pool.filter((x) => x.c === c).map((x) => (
          <button key={x.id} className="opt" aria-pressed={sel.includes(x.id)} onClick={() => tog(x.id)}>
            <span className="ck">{sel.includes(x.id) && <Ic n="tick" s={16} />}</span><span className="rb"><b>{x.title}</b><small>{KIND[x.k][0]} · {fmt(x.due)}</small></span><span className={"pl " + tone(x)}>{label(x)}</span></button>))}</div>)}
        <button className="btn pri wide" onClick={() => setPk(false)}>Done{sel.length ? ` (${sel.length} added)` : ""}</button>
      </div></>}
    </div>
  );
}
