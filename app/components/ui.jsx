import { useEffect, useState } from "react";
import { KIND, F, tone, label, mmss, vstate } from "../lib/util";

const P = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  cal: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  book: <><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18" /></>,
  spark: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 16v4M17 18h4" /></>,
  bell: <><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  quiz: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" /></>,
  mega: <><path d="M3 10v4h4l9 4V6L7 10z" /><path d="M19 9.5a4 4 0 0 1 0 5" /></>,
  flame: <path d="M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.6 1 2.4 2 2.7-.5-3 .3-6 1-9z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>, tick: <path d="M5 12.5l4.5 4.5L19 7" />,
  alert: <><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17h.01" /></>,
  plus: <path d="M12 5v14M5 12h14" />, x: <path d="M6 6l12 12M18 6L6 18" />, left: <path d="M15 5l-7 7 7 7" />, right: <path d="M9 5l7 7-7 7" />, chev: <path d="M6 9l6 6 6-6" />, arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" /><path d="M20 3v5h-5" /></>, out: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />, send: <path d="M4 12L20 4l-5 16-3-7z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>, copy: <><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  down: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />, info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  plane: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />, lock: <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />, target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  shield: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />, grid: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
};
export const Ic = ({ n, s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>;

export function Ring({ pct = 0, size = 96, stroke = 12, color = "var(--brand)", children }) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, pct))} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <span className="ringc">{children}</span>
    </span>
  );
}

// One line for any item: assignment, quiz, video or event.
export function Row({ x, onPick, course = true }) {
  const [name, col, ic] = KIND[x.k], T = onPick ? "button" : "div", v = x.l;
  const meta = x.k === "lecture"
    ? [v.lesson ? `Lesson ${v.lesson}` : null, v.secs ? mmss(v.secs) : null, x.due ? "Attendance due " + F(x.due, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null].filter(Boolean).join(" · ")
    : [name, x.due ? F(x.due, { hour: "2-digit", minute: "2-digit" }) : null, x.pts != null ? `${x.pts} pts` : null].filter(Boolean).join(" · ");
  return (
    <T className={"row " + tone(x) + (x.k === "lecture" ? " vid" : "")} onClick={onPick}>
      {x.k === "lecture" ? <StatusRing x={x} /> : <span className="ib" style={{ background: col }}><Ic n={ic} /></span>}
      <span className="rb"><b>{x.title}</b><small>{course && x.c.name + " · "}{meta}</small></span>
      {x.k === "lecture" && v.att && <span className="tagx">Attendance</span>}
      <span className="pl">{x.done && <Ic n="tick" s={14} />}{label(x)}</span>
    </T>
  );
}
export const Empty = ({ icon = "check", title, text }) => <div className="empty"><span className="ib"><Ic n={icon} s={24} /></span><b>{title}</b>{text && <p>{text}</p>}</div>;

export const Logo = () => <span className="logo"><i><Ic n="plane" s={20} /></i><b>Study<em>Pilot</em></b></span>;
// Status of a video as a ring: complete (check), missed (dashed), to watch (pulsing), not open yet (lock).
export function StatusRing({ x }) {
  const s = vstate(x);
  return (<span className={"sr " + s}><svg viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="20" /></svg><i><Ic n={s === "done" ? "tick" : s === "missed" ? "x" : s === "locked" ? "lock" : "play"} s={17} /></i></span>);
}
// The AI coach as a living orb. "busy" makes it breathe faster while the AI is answering.
export const Orb = ({ s = 64, busy = false }) => <span className={"orb" + (busy ? " busy" : "")} style={{ "--s": s + "px" }} aria-hidden="true"><i className="oc" /><i className="os" /></span>;
// Count-up number.
export function Num({ n, ms = 700 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(n); return; }
    let raf, t0; const step = (t) => { if (t0 === undefined) t0 = t; const p = Math.min(1, (t - t0) / ms); setV(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [n, ms]);
  return <>{v}</>;
}
