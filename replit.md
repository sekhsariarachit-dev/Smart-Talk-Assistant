# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **TTS**: OpenAI TTS (alloy voice, mp3)

## Artifacts

### AI Chatbot (`artifacts/chatbot`)
A full-featured AI chatbot with:
- Text and voice input (Web Speech Recognition API)
- AI responses via OpenAI gpt-5.2
- Text-to-speech via OpenAI TTS (alloy voice)
- File/image/video attachments with content extraction
- Private per-user sessions (userId stored in localStorage)
- Delete chat functionality
- Step-by-step interactive tutorial on first launch
- White background, black text design
- Session history with sidebar

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── chatbot/            # React + Vite AI chatbot frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side integration
│   └── integrations-openai-ai-react/   # OpenAI React integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Tables

- `conversations` - from OpenAI integration template
- `messages` - from OpenAI integration template
- `chat_sessions` - userId, title, timestamps
- `chat_messages` - sessionId, role, content, attachments JSON

## API Routes

- `GET /api/chat/sessions?userId=...` - List sessions for a user
- `POST /api/chat/sessions` - Create new session
- `DELETE /api/chat/sessions/:sessionId` - Delete session
- `GET /api/chat/messages?sessionId=...` - List messages
- `POST /api/chat/messages` - Send message and get AI reply
- `POST /api/files/upload` - Upload file (multipart, returns dataURL + extracted text)
- `POST /api/tts/speak` - Text to speech (returns audio/mpeg)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/api-spec run codegen` — regenerates API client and Zod schemas
- `pnpm --filter @workspace/db run push` — push schema changes to DB
