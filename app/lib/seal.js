// AES-256-GCM sealing: the sign-in is stored in an encrypted cookie the browser cannot read.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
function secret() {
  if (process.env.SESSION_SECRET) return crypto.createHash("sha256").update(process.env.SESSION_SECRET).digest();
  const f = path.join(process.cwd(), ".session-secret");
  try { const k = Buffer.from(fs.readFileSync(f, "utf8").trim(), "hex"); if (k.length === 32) return k; } catch {}
  const k = crypto.randomBytes(32); fs.writeFileSync(f, k.toString("hex"), { mode: 0o600 }); return k;
}
export function seal(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", secret(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}
export function unseal(s) {
  try {
    const b = Buffer.from(String(s), "base64url"), d = crypto.createDecipheriv("aes-256-gcm", secret(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
  } catch { return null; }
}
