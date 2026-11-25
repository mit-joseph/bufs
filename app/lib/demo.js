// Sample data for presentations and previews. Dates are relative to "now" so it always looks current.
const iso = (h) => new Date(Date.now() + h * 36e5).toISOString();
const A = (id, name, h, pts, state, desc, quiz = false, score = null) => ({ id, name, due: h == null ? null : iso(h), points: pts, url: "https://canvas.bufs.ac.kr", quizId: quiz ? id : null, state, score, submittedAt: state === "unsubmitted" ? null : iso(-48), desc, isQuiz: quiz });
const T = ["Orientation", "Core vocabulary", "Grammar basics", "Reading practice", "Writing practice", "Listening practice", "Review words", "Review grammar", "Culture notes", "Speaking drills", "Mid-unit review", "Final review"];
function vids(cid, from, to, cur, missed = []) {
  const out = [];
  for (let w = from; w <= to; w++) for (let l = 1; l <= 3; l++) {
    const base = (w - cur) * 168 + 30 + (l - 1) * 24, secs = 1500 + ((w * 7 + l * 13) % 12) * 60 + ((w * l * 11) % 60);
    const m = missed.includes(`${w}-${l}`), done = !m && (w < cur || (w === cur && l === 1));
    out.push({ id: `${cid}${w}${l}`, title: `${T[(w + l) % T.length]}`, week: `${w}주차`, lesson: l, att: true, secs, pct: done ? 100 : w === cur && l === 2 ? 40 : 0, type: "movie",
      due: iso(base), unlock: w > cur ? iso(base - 168) : null, done, url: "https://canvas.bufs.ac.kr" });
  }
  return out;
}
const course = (id, name, score, asg, v, ann = [], ev = []) => ({ id, name, term: "2026 Fall", url: "https://canvas.bufs.ac.kr", score, grade: null, lx: { status: 200, items: v }, assignments: asg, announcements: ann, events: ev });
const note = (id, title, h, body) => ({ id, title, at: iso(h), body: `<p>${body}</p>` });
export function demoData() {
  const courses = [
    course(101, "Introduction to Korean History II", 91, [
      A(1, "Quiz about the fall of Joseon", 52, 3, "unsubmitted", "", true), A(2, "Quizzes about the Imjin War", 52, 3, "unsubmitted", "", true),
      A(3, "Essay: Arts in the early Joseon dynasty", 170, 10, "unsubmitted", "<p>Write a <b>600-word essay</b> on one art form from the early Joseon period.</p><ul><li>Use at least two sources</li><li>Explain why it mattered at the time</li></ul>"),
      A(4, "Quiz: Three Kingdoms", -300, 3, "graded", "", true, 3)], vids(101, 9, 12, 11, ["9-2"]),
      [note(1, "Midterm review session", -20, "We will review the Joseon period on Friday. Bring your questions.")], [{ id: 1, title: "Final exam", start: iso(330), loc: "Room 402", desc: "<p>Covers weeks 9 to 15.</p>" }]),
    course(102, "Public Speaking II", 88, [
      A(5, "Homework #7", 29, 10, "unsubmitted", "<p>1. Share one source you will use in your final speech.</p><p>2. Share one image or slide you will use and explain how it makes your talk more engaging.</p>"),
      A(6, "Final speech outline", 140, 20, "unsubmitted", "<p>Submit a one-page outline of your final speech.</p>"), A(7, "Homework #6", -100, 10, "graded", "", false, 9)], [], [note(2, "Speech schedule posted", -6, "The final speech order is now on the course page.")]),
    course(103, "AI App Development and Services", null, [
      A(8, "[Assignment Notice] My AI-Powered Web Application", 96, 10, "unsubmitted", "<p>Develop a simple AI-powered web application that solves a problem from your own life.</p><ul><li>Use Python, Flask, Streamlit or a Hugging Face model</li><li>Explain the problem, your solution and how to run it</li></ul>"),
      A(9, "Week 2 reading response", -200, 5, "submitted", "")], vids(103, 10, 12, 11)),
    course(104, "Introduction to Economics II", 84, [
      A(10, "Ch.6 Review Questions", 140, 10, "unsubmitted", "<p>Answer review questions 11 to 15 on measuring GDP.</p>"), A(11, "GDP worksheet", -30, 5, "unsubmitted", "<p>Complete the worksheet on double counting.</p>")], [], []),
    course(105, "Foundation of Korean Reading and Writing", 95, [
      A(12, "WRITING 02_ASSIGNMENT", 330, 10, "unsubmitted", "<p>Write 10 sentences using this week's grammar.</p>"), A(13, "CL01_QUIZ", -500, 3, "graded", "", true, 3), A(14, "CL02_QUIZ", 60, 3, "unsubmitted", "", true)],
      vids(105, 5, 8, 7, ["6-2"]), [note(3, "New lessons are open", -40, "Week 7 lessons are now available.")]),
    course(106, "Global Society", 90, [A(15, "Class reflection", 200, 5, "unsubmitted", "<p>Reflect on this week's discussion in 150 words.</p>")], []),
  ];
  return { courses, me: { name: "Alex" }, fetchedAt: new Date().toISOString(), demo: true };
}
