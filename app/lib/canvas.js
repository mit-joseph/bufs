import sanitizeHtml from "sanitize-html";
export const BASE = process.env.CANVAS_BASE || "https://canvas.bufs.ac.kr";
export const headersFor = (auth) => ({ Accept: "application/json", ...(auth.token ? { Authorization: "Bearer " + auth.token } : { Cookie: auth.cookie }) });
export async function get(path, auth) {
  let url = BASE + path, out = [];
  while (url) {
    const r = await fetch(url, { headers: headersFor(auth), cache: "no-store" });
    if (!r.ok) { const e = new Error("Canvas " + r.status); e.status = r.status; throw e; }
    const d = JSON.parse((await r.text()).replace(/^while\(1\);/, ""));
    out = out.concat(Array.isArray(d) ? d : [d]);
    const n = (r.headers.get("link") || "").split(",").find((x) => /rel="next"/.test(x)), nu = n && n.match(/<([^>]+)>/)[1];
    url = nu && new URL(nu).host === new URL(BASE).host ? nu : null;
  }
  return out;
}
const abs = (u = "") => (u.startsWith("/") && !u.startsWith("//") ? BASE + u : u);
// Allow-list sanitizer: only harmless formatting tags survive. Scripts, event handlers, styles and unsafe links are removed.
export const clean = (h = "") => sanitizeHtml(h, {
  allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "img", "h1", "h2", "h3", "h4", "h5", "blockquote", "pre", "code", "hr", "span", "div", "table", "thead", "tbody", "tr", "th", "td"],
  allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
  allowedSchemes: ["http", "https", "mailto"], allowProtocolRelative: false,
  transformTags: {
    a: (t, a) => ({ tagName: "a", attribs: { href: abs(a.href), target: "_blank", rel: "noopener noreferrer" } }),
    img: (t, a) => ({ tagName: "img", attribs: { src: abs(a.src), alt: a.alt || "" } }),
  },
});
