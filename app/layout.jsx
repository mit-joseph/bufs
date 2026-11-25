import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/sora";
import "./globals.css";
export const metadata = { title: "BUFS Planner", description: "Your BUFS study co-pilot: assignments, quizzes, lecture videos, reminders and an AI coach in one place." };
const theme = "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}";
export default function RootLayout({ children }) {
  return (<html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: theme }} /></head><body>{children}</body></html>);
}
