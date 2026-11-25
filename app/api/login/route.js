// Best-effort sign-in with student ID + password on BUFS Canvas. The password is used once, here, and never stored or logged.
import { BASE } from "../../lib/canvas";
import { setAuth } from "../../lib/session";
import { limited, ip } from "../../lib/guard";
const jar = (res, c) => { for (const s of res.headers.getSetCookie?.() || []) { const kv = s.split(";")[0], i = kv.indexOf("="); c[kv.slice(0, i).trim()] = kv.slice(i + 1); } };
const hdr = (c) => Object.entries(c).map(([k, v]) => k + "=" + v).join("; ");
const SSO = "BUFS Canvas does not offer a direct ID and password form here (it uses single sign-on). Use the access token option instead.";
export async function POST(req) {
  if (limited("login" + ip(req), 8, 6e5)) return Response.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  const { id, password } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || typeof password !== "string" || !id || !password || id.length > 64 || password.length > 128) return Response.json({ error: "Enter your student ID and password." }, { status: 400 });
  try {
    const c = {}, page = await fetch(BASE + "/login/canvas", { redirect: "manual" });
    jar(page, c);
    const html = await page.text(), tok = (html.match(/name="authenticity_token"[^>]*value="([^"]+)"/) || html.match(/value="([^"]+)"[^>]*name="authenticity_token"/) || [])[1];
    if (page.status >= 300 || !tok) return Response.json({ error: SSO }, { status: 501 });
    let r = await fetch(BASE + "/login/canvas", { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded", cookie: hdr(c) },
      body: new URLSearchParams({ utf8: "✓", authenticity_token: tok, "pseudonym_session[unique_id]": id, "pseudonym_session[password]": password, "pseudonym_session[remember_me]": "0" }) });
    jar(r, c);
    for (let i = 0; i < 4 && r.status >= 300 && r.status < 400; i++) {
      const u = new URL(r.headers.get("location") || "/", BASE); if (u.host !== new URL(BASE).host) break;
      r = await fetch(u, { redirect: "manual", headers: { cookie: hdr(c) } }); jar(r, c);
    }
    const me = await fetch(BASE + "/api/v1/users/self", { headers: { cookie: hdr(c), Accept: "application/json" } });
    if (!me.ok) return Response.json({ error: "Sign-in failed. Check your ID and password, or use the access token option." }, { status: 401 });
    setAuth({ cookie: hdr(c) });
    return Response.json({ ok: true });
  } catch (e) { return Response.json({ error: "Could not reach canvas.bufs.ac.kr." }, { status: 502 }); }
}
