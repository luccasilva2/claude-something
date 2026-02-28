# ChatClaude

ChatClaude is a local-first AI workspace powered by Gemini, with:
- multi-mode assistants (`n8n`, `coder`, `pesquisa`, `leitura`)
- local context retrieval from your own files
- n8n template prioritization from cloned repositories
- Supabase auth + chat persistence
- per-response feedback (`👍/👎`)
- optional local filesystem command agent

## Core Features

- Mode Selector
`n8n`: enterprise workflow architecture and hardening
`coder`: implementation-focused engineering assistant
`pesquisa`: deep analysis and decision support
`leitura`: structured reading and summarization

- Local Context RAG
Automatically searches configured folders and injects relevant excerpts into prompts.

- n8n Template-First Behavior
When queries are about n8n/workflows, template repositories are prioritized.

- Supabase Persistence
Stores sessions, messages, and feedback by authenticated user.

- Chat Management
Create, rename, delete chats.
First user message auto-generates chat title.

- Local File Agent (Optional)
Read/list/write files via chat commands with approval flow.

## Project Structure

- `src/app` Next.js App Router pages and API routes
- `src/app/api/chat/stream/route.ts` streaming chat endpoint
- `src/ai/flows/chat-with-ai-flow.ts` prompt orchestration
- `src/lib/local-context-rag.ts` local file context retrieval
- `src/lib/local-fs-agent.ts` local filesystem command agent
- `src/lib/chat-modes.ts` assistant mode contracts
- `supabase/schema.sql` database schema + RLS policies

## Requirements

- Node.js 20+
- npm
- Supabase project
- Gemini API key

## Local Setup

1. Install dependencies
```bash
npm install
```

2. Create env file
```bash
cp .env.example .env.local
```

3. Fill `.env.local`
Use [.env.example](/home/lucca/projects/claude-something/.env.example) as reference.

4. Initialize Supabase database
Run [schema.sql](/home/lucca/projects/claude-something/supabase/schema.sql) in Supabase SQL Editor.

5. Enable Supabase Auth provider
In Supabase, enable `Email` provider.

6. Start development server
```bash
npm run dev
```

## n8n Templates Integration

Clone template repositories inside project root (already done in your setup):
- `n8n-workflows`
- `awesome-n8n-templates`
- `n8n-free-templates`

Set `N8N_TEMPLATE_ROOTS` in `.env.local` to those absolute paths.

## Chat API

- `POST /api/chat` non-stream response
- `POST /api/chat/stream` NDJSON streaming response (`meta`, `delta`, `done`)

Payload supports:
- `message: string`
- `history: { role, content }[]`
- `mode: n8n | coder | pesquisa | leitura`

## Local FS Commands

When `ENABLE_LOCAL_FS_AGENT=true`:

- `/helpfs`
- `/ls <path>`
- `/read <path>`
- `/stat <path>`
- `/mkdir <path>`
- `/write <path>` + content in next lines
- `/append <path>` + content in next lines
- `/pending`
- `/approve <action-id>`
- `/reject <action-id>`

If `AUTO_APPROVE_FS_WRITES=false`, write operations require explicit approval.

## Security Notes

- Keep secrets only in environment variables.
- Regenerate any key that was exposed in chat/logs.
- Disable local FS agent in untrusted or cloud environments.
- Use Supabase RLS policies as defined in `supabase/schema.sql`.

## Cloud (Firebase App Hosting)

Use [apphosting.yaml](/home/lucca/projects/claude-something/apphosting.yaml) for cloud env/secrets configuration.
Recommended:
- store `GEMINI_API_KEY` in Secret Manager
- keep local filesystem features disabled in cloud

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run smoke:chat
```
