import { BASE, get, clean, headersFor } from "../../lib/canvas";
import { walk } from "../../lib/lx";
import { getAuth, clearAuth } from "../../lib/session";
import { demoData } from "../../lib/demo";
const safe = (p, a) => get(p, a).catch(() => []);

async function videos(c, me, auth) {
  const q = `?user_id=${me.id}&user_login=${encodeURIComponent(me.login_id || "")}&role=1`;
  let first = null;
  for (const p of ["allcomponents_db", "allcomponents"]) {
    try {
      const r = await fetch(`${BASE}/learningx/api/v1/courses/${c.id}/${p}${q}`, { headers: headersFor(auth), cache: "no-store" }), t = await r.text();
      let items = []; try { items = walk(JSON.parse(t.replace(/^while\(1\);/, ""))); } catch {}
      if (items.length) return { status: r.status, items };
      first ||= { status: r.status, items: [] };
    } catch { first ||= { status: 0, items: [] }; }
  }
  return first;
}
export async function POST() {
  const auth = getAuth();
  if (!auth) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (auth.demo) return Response.json(demoData());
  try {
    const all = await get("/api/v1/courses?enrollment_state=active&per_page=100&include[]=total_scores&include[]=term", auth);
    const me = (await safe("/api/v1/users/self/profile", auth))[0] || {};
    const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), to = new Date(Date.now() + 150 * 864e5).toISOString().slice(0, 10);
    const courses = await Promise.all(all.filter((c) => c.name && !c.name.startsWith("[")).map(async (c) => {
      const [asg, ann, ev, lx] = await Promise.all([
        safe(`/api/v1/courses/${c.id}/assignments?include[]=submission&per_page=100&order_by=due_at`, auth),
        safe(`/api/v1/announcements?context_codes[]=course_${c.id}&per_page=20`, auth),
        safe(`/api/v1/calendar_events?type=event&context_codes[]=course_${c.id}&start_date=${from}&end_date=${to}&per_page=100`, auth),
        videos(c, me, auth),
      ]);
      const en = (c.enrollments || [])[0] || {};
      return {
        id: c.id, name: c.name, term: c.term?.name || "", url: `${BASE}/courses/${c.id}`, score: en.computed_current_score ?? null, grade: en.computed_current_grade ?? null, lx,
        assignments: asg.map((a) => ({ id: a.id, name: a.name, due: a.due_at, points: a.points_possible, url: a.html_url, quizId: a.quiz_id || null, state: a.submission?.workflow_state || "unsubmitted",
          score: a.submission?.score ?? null, submittedAt: a.submission?.submitted_at || null, desc: clean(a.description), isQuiz: !!a.quiz_id })),
        announcements: ann.map((n) => ({ id: n.id, title: n.title, at: n.posted_at, body: clean(n.message) })),
        events: ev.map((e) => ({ id: e.id, title: e.title, start: e.start_at, loc: e.location_name || "", desc: clean(e.description) })),
      };
    }));
    return Response.json({ courses, me: { name: me.short_name || me.name || "" }, fetchedAt: new Date().toISOString() });
  } catch (e) {
    if (e.status === 401) { clearAuth(); return Response.json({ error: "Your BUFS sign-in expired. Please sign in again." }, { status: 401 }); }
    return Response.json({ error: "Could not reach canvas.bufs.ac.kr. Try Refresh in a moment." }, { status: 502 });
  }
}
