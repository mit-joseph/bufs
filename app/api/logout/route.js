import { clearAuth } from "../../lib/session";
export async function POST() { clearAuth(); return Response.json({ ok: true }); }
