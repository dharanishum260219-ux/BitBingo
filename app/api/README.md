## API Overview

This app uses Next.js App Router route handlers under `app/api/arena`.

### Active routes

- `GET /api/arena?session_id=<uuid>`
	- Returns the session-scoped arena snapshot (sessions, teams, challenges, completions).
- `POST /api/arena/sessions`
	- Creates a session with `name`, `durationMinutes`, optional `challengeIds`, optional `teamNames`, and optional `questionRows`.
- `POST /api/arena/teams`
	- Registers a team for a specific session (`name`, `sessionId`).
- `POST /api/arena/teams/:id/score`
	- Awards score to a team in a specific session (`sessionId`).
- `POST /api/arena/completions`
	- Logs challenge completion for a participant (`participantId`, `challengeId`, `sessionId`, optional `proofUrl`).
- `GET /api/arena/challenges`
	- Returns the global challenge pool.
- `POST /api/arena/challenges`
	- Upserts challenge rows for CSV imports (`rows[]` with `title`, `description`, `difficulty`, optional `points`).

### Operational routes

- `GET /api/health`
	- Lightweight health check for deployment smoke tests.
