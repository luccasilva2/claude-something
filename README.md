## Gemini + Local Skills Chat + Supabase

This project uses Gemini with local skills plus automatic local file context retrieval.
It supports Supabase persistence (email/password auth, sessions, messages).
It supports per-response feedback (thumbs up/down) stored in Supabase.

### Setup

1. Create env file:

```bash
cp .env.example .env.local
```

2. Fill `.env.local`:

```env
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ENABLE_LOCAL_FS_AGENT=true
AUTO_APPROVE_FS_WRITES=false
ENABLE_AUTO_LOCAL_CONTEXT=true
LOCAL_CONTEXT_ROOTS=/home/lucca/projects,/home/lucca/Documents
```

3. In Supabase SQL Editor, run:

`supabase/schema.sql`

4. In Supabase Authentication:

- Enable `Email` provider.

5. Run development server:

```bash
npm run dev
```

### Automatic SSD/local context

For every prompt, backend can search local files and inject relevant excerpts automatically.
Configure roots with `LOCAL_CONTEXT_ROOTS` (comma-separated paths).

### Chat Commands (Local FS Agent)

When `ENABLE_LOCAL_FS_AGENT=true`, you can run filesystem commands directly from chat:

- `/helpfs`
- `/ls <path>`
- `/read <path>`
- `/stat <path>`
- `/mkdir <path>` (requires approval by default)
- `/write <path>` then content on next lines (requires approval by default)
- `/append <path>` then content on next lines (requires approval by default)
- `/pending`
- `/approve <action-id>`
- `/reject <action-id>`

Approval model:

- With `AUTO_APPROVE_FS_WRITES=false`, write actions are queued and require `/fs approve <id>`.
- With `AUTO_APPROVE_FS_WRITES=false`, write actions are queued and require `/approve <id>`.
- With `AUTO_APPROVE_FS_WRITES=true`, write actions execute immediately.

### How it works

- Frontend sends message + recent history to `POST /api/chat/stream`.
- If message starts with `/fs`, server handles the local filesystem command.
- Otherwise server gathers local skills + automatic local file context and calls Gemini.
- Streaming response returns NDJSON chunks (`meta`, `delta`, `done`).
- Frontend logs in user with Supabase and persists chat sessions/messages.

### Security

- Keep API keys in env vars only.
- Local filesystem access is powerful; use only in trusted local environments.
