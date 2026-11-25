// Sample-data mode for presentations. Off in production unless ALLOW_DEMO=1.
import { setAuth } from "../../lib/session";
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO !== "1") return Response.json({ error: "Demo mode is off." }, { status: 403 });
  setAuth({ demo: true });
  return Response.json({ ok: true });
}
