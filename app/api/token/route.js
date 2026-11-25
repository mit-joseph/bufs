import { BASE } from "../../lib/canvas";
import { setAuth } from "../../lib/session";
import { limited, ip } from "../../lib/guard";
export async function POST(req) {
  if (limited("tok" + ip(req), 10, 6e5)) return Response.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  const { token } = await req.json().catch(() => ({}));
  const t = typeof token === "string" ? token.trim() : "";
  if (t.length < 20 || t.length > 300 || /\s/.test(t)) return Response.json({ error: "That does not look like an access token." }, { status: 400 });
  try {
    const r = await fetch(BASE + "/api/v1/users/self", { headers: { Authorization: "Bearer " + t, Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) return Response.json({ error: "Canvas rejected this token. Check that it is copied in full and has not expired." }, { status: 401 });
  } catch (e) { return Response.json({ error: "Could not reach canvas.bufs.ac.kr." }, { status: 502 }); }
  setAuth({ token: t });
  return Response.json({ ok: true });
}
