import { cookies } from "next/headers";
import { seal, unseal } from "./seal";
const NAME = "bp_session", DAYS = 14;
export function getAuth() {
  const v = cookies().get(NAME)?.value, o = v && unseal(v);
  return o && o.exp > Date.now() ? o.a : null;
}
export function setAuth(a) {
  cookies().set({ name: NAME, value: seal({ a, exp: Date.now() + DAYS * 864e5 }), httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DAYS * 86400 });
}
export const clearAuth = () => cookies().set({ name: NAME, value: "", httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
