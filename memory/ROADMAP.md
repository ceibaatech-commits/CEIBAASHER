# Roadmap / Backlog

## P1 — Pending verification
- **Google OAuth logout fix testing**: code written sessions ago, never verified. Test login via Google Auth → session persists on Victory Lane (no forced logout). Both messaging & social sockets now also resolve opaque Google session tokens (Jun 12), which should help.

## P2
- **Twitter/Facebook login UI stubs** on `/app/frontend/src/pages/Login.js` — add buttons with "Coming soon" until user supplies API keys (recurrence count: 7, BLOCKED on keys but UI should be stubbed).
- Decompose oversized frontend files: `ExamSheetManager.js` (1039 lines), `ExamCategoryManager.js` (767), `Board.js` (691).
- Move `exam_data_store.py` content to MongoDB.
- Program enrollment/payment flow (Stripe — test key available in pod env).
- Optional: dedupe the 4 clustered initial `/api/messages/unread-count` calls on mount (StrictMode double-mount; harmless, noted by testing agent iteration_31).

## P3
- Google Search Console integration.
- Profile badges and Alumni tags.

## Standing rules
- Do NOT re-introduce localStorage token reads — Admin/Employee/Recruiter/Student auth is httpOnly-cookie based (dual-mode Bearer fallback).
- Socket.IO sub-apps are mounted with `socketio.ASGIApp(sio, socketio_path='')` at `/api/battlews`, `/api/socialws`, `/api/messagews` — do not change.
- python-socketio 5.14: `enter_room`/`leave_room` are async — always `await`.
- Motor `db` objects: never truth-test (`if not db`) — use `if db is None`.
- ETHICS: Do NOT create synthetic/backdated users to inflate investor metrics. Legitimate imports only (`imported=True`, real timestamps).
