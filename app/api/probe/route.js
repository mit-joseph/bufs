// Lecture diagnostics: shows what BUFS's lecture tool answers for one course, so the video reader can be tuned.
import { BASE, get, headersFor } from "../../lib/canvas";
import { getAuth } from "../../lib/session";
import { limited, ip } from "../../lib/guard";
export async function POST(req) {
  const auth = getAuth(); if (!auth || auth.demo) return Response.json({ error: "Sign in with your BUFS account to run this check." }, { status: 401 });
  if (limited("probe" + ip(req), 12, 6e5)) return Response.json({ error: "Too many checks. Wait a few minutes." }, { status: 429 });
  const { courseId } = await req.json().catch(() => ({}));
  const cid = String(courseId || "").replace(/\D/g, "");
  const mods = await get(`/api/v1/courses/${cid}/modules?include[]=items&per_page=3`, auth).catch(() => []);
  const iid = String(mods.flatMap((m) => m.items || []).find((i) => i.type === "ExternalTool")?.id || "");
  if (!cid) return Response.json({ error: "No course." }, { status: 400 });
  const me = (await get("/api/v1/users/self/profile", auth).catch(() => []))[0] || {};
  const tries = [
    ["Lecture tool: all components", `/learningx/api/v1/courses/${cid}/allcomponents_db?user_id=${me.id}&user_login=${encodeURIComponent(me.login_id || "")}&role=1`],
    ["Lecture tool: modules", `/learningx/api/v1/courses/${cid}/modules?include_detail=true`],
    ["Lecture tool: attendance", `/learningx/api/v1/courses/${cid}/attendance_items`],
    ["Canvas module item page", `/courses/${cid}/modules/items/${iid}`],
    ["Canvas lecture launch", `/api/v1/courses/${cid}/external_tools/sessionless_launch?launch_type=module_item&module_item_id=${iid}`],
  ];
  const results = [];
  for (const [name, path] of tries) {
    try {
      const r = await fetch(BASE + path, { headers: headersFor(auth), redirect: "manual", cache: "no-store" }), t = await r.text();
      results.push({ name, path: path.replace(/user_id=\d+&user_login=[^&]*/, "user_id=..."), status: r.status, type: r.headers.get("content-type"), sample: t.replace(/verifier=[^&"'\s]+/g, "verifier=[hidden]").replace(/\s+/g, " ").slice(0, 500) });
    } catch (e) { results.push({ name, status: 0, sample: "Could not connect." }); }
  }
  return Response.json({ results });
}
