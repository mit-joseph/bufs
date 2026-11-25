import fs from "node:fs";
import path from "node:path";
// The no-install option: the same page reader the extension uses, wrapped so it copies its result to the clipboard.
export async function GET() {
  const src = fs.readFileSync(path.join(process.cwd(), "extension", "collect.js"), "utf8");
  const run = `\n(async () => { try { const r = await bufsCollectConsole(); const s = JSON.stringify(r, (k, v) => (typeof v === "string" && v.length > 300 ? v.slice(0, 300) : v)); try { copy(s); console.log("Copied " + Math.round(s.length / 1024) + " KB. Now paste it into BUFS Planner."); } catch (e) { console.log(s); } } catch (e) { console.log("Problem: " + e.message); } })();`;
  return new Response(src + run, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
