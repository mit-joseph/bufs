"use client";
import { useState } from "react";
import { Ic, Orb, Logo } from "./ui";

const PREVIEW = [["late", "doc", "#4f6bff", "Homework #7", "Public Speaking", "Overdue"], ["hot", "quiz", "#d946ef", "Quiz: Imjin War", "Korean History", "5h left"], ["done", "play", "#06a6c9", "Week 3 lecture video", "Foundations of Korean", "Complete"], ["ok", "doc", "#4f6bff", "Essay draft", "Global Society", "3d left"]];
export default function Login({ onAuth, onDemo, busy, err }) {
  const [mode, setMode] = useState("id"), [id, setId] = useState(""), [pw, setPw] = useState(""), [tk, setTk] = useState("");
  const go = () => { if (mode === "id") { onAuth("id", { id: id.trim(), password: pw }); setPw(""); } else { onAuth("token", { token: tk.trim() }); setTk(""); } }, key = (e) => e.key === "Enter" && go();
  return (
    <div className="lg">
      <div className="art">
        <Logo />
        <div className="artc"><div><h1 className="rise">Every assignment, quiz and lecture video. One calm place.</h1><p className="lead">BUFS Planner reads your BUFS Canvas and tells you what to do next, with an AI coach that knows your deadlines.</p></div>
          <div className="prev">{PREVIEW.map(([t, ic, col, a, b, p], k) => <div key={a} className={"row " + t} style={{ "--i": k }}><span className="ib" style={{ background: col }}><Ic n={ic} /></span><span className="rb"><b>{a}</b><small>{b}</small></span><span className="pl">{p}</span></div>)}</div></div>
        <ul className="feats"><li><Ic n="flame" s={16} />Deadlines ranked by urgency</li><li><Ic n="play" s={16} />Video progress, complete or not</li><li><Ic n="spark" s={16} />AI study coach</li></ul>
      </div>
      <div className="form card"><Orb s={54} /><h2>Welcome to BUFS Planner</h2><p className="sub">Sign in with your BUFS e-class account.</p>
        <div className="seg" role="tablist"><button role="tab" aria-selected={mode === "id"} onClick={() => setMode("id")}>Student ID</button><button role="tab" aria-selected={mode === "token"} onClick={() => setMode("token")}>Access token</button></div>
        {mode === "id" ? <><input placeholder="Student ID" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={key} autoComplete="username" />
          <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={key} autoComplete="current-password" /></>
          : <input type="password" placeholder="Paste your access token" value={tk} onChange={(e) => setTk(e.target.value)} onKeyDown={key} autoComplete="off" />}
        <button className="btn pri wide" onClick={go} disabled={busy}>{busy ? "Signing in..." : "Continue"}</button>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="link" onClick={onDemo} disabled={busy}>Or explore with sample data</button>
        <p className="fine"><Ic n="shield" s={16} /> Your sign-in is stored in an encrypted cookie that scripts cannot read. Sign out wipes it.</p></div>
    </div>
  );
}
