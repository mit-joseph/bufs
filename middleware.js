import { NextResponse } from "next/server";
// Security layer for every request: blocks cross-site POSTs (CSRF) and sets strict browser security headers.
export function middleware(req) {
  const host = req.headers.get("host");
  if (req.nextUrl.pathname.startsWith("/api/") && req.method !== "GET") {
    const o = req.headers.get("origin");
    let ok = false; try { ok = !!o && new URL(o).host === host; } catch {}
    if (!ok) return new NextResponse(JSON.stringify({ error: "Blocked." }), { status: 403, headers: { "content-type": "application/json" } });
  }
  const dev = process.env.NODE_ENV !== "production";
  const csp = ["default-src 'self'", `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data: https:",
    "font-src 'self' data:", `connect-src 'self'${dev ? " ws://localhost:3211 ws://127.0.0.1:3211" : ""}`, "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join("; ");
  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (req.nextUrl.pathname.startsWith("/api/")) res.headers.set("Cache-Control", "no-store");
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
