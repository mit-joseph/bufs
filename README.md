# BUFS Planner (canvas-hub)

*Your BUFS study co-pilot.*

Assignments, quizzes, **videos (complete or not)**, announcements, calendar, reminders and an AI study coach for BUFS Canvas.

## Design
Glass interface with a clear **week planner** (everything due, day by day), an animated AI orb, a study level (20 XP per submitted task, 10 per completed video), light and dark themes, and a Ctrl+K search.

## Run
```
npm install
cp .env.example .env.local     # then paste your two Gemini keys into it
npm run dev                    # open http://localhost:3211
```
For the fastest, smoothest feel (for example when presenting): `npm run prod`.

## Videos: install the connector once
BUFS keeps video progress inside its own website, so a small Chrome extension reads it for you (only on your computer, only your own pages).
1. Chrome: open `chrome://extensions`, switch on **Developer mode**.
2. **Load unpacked** and choose the `extension` folder in this project.
3. Reload the planner page. Open any course and its **Videos** tab: the card turns green and your lecture videos sync by themselves. Only real lecture videos are shown; PDFs, files and assignments on the Weekly Learning page are ignored.
No install? Course > Videos > "No install? Manual option".

## Security in short
Sign-in lives in an encrypted, HttpOnly cookie; cross-site requests are blocked; strict browser security headers; Canvas HTML is sanitized; login attempts are rate limited; the server only listens on your own computer. Keep `.env.local` private.
