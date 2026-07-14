# i.vision — Personal AI Knowledge Assistant

## What's actually working in this build

**Fully working (real code, not mocked):**
- JWT auth — register/login (`/api/auth/register`, `/api/auth/login`)
- PostgreSQL schema — Users, Chats, Messages, Knowledge Sources, Documents,
  Embeddings Metadata, GitHub/YouTube/Website/LeetCode tables, Memory,
  Settings, Activity Logs
- Document upload pipeline: PDF/DOCX/PPTX/TXT/MD → text extraction → chunking
  → BAAI/bge-small-en-v1.5 embeddings → Qdrant storage — fully automatic
- RAG chat: query → embed → Qdrant search (scoped to the user) → context
  construction → Groq LLM → response with citations
- Sidebar + chat workspace UI (`/app`) wired to all the above endpoints
- Universal search across chats + knowledge titles

**Architected but not activated** (real DB models + API routes + UI exist;
each needs an external credential/service to fetch live data):
- GitHub repo indexing — needs a GitHub token + background worker to walk
  the repo tree and push files through the same embed/store pipeline
- YouTube transcripts — needs `youtube-transcript-api` wired into a worker
- Website saving — needs a fetch + content-extraction step
- LeetCode sync — needs a call to LeetCode's public GraphQL endpoint

**Not built this pass:**
- Voice assistant (speech-to-text/text-to-speech)
- LangGraph multi-tool orchestration (current RAG is a direct pipeline,
  not yet a graph with automatic tool selection across sources)
- Streaming responses (current chat waits for the full Groq response)

## Run it

```bash
cp .env.example .env
# put your free Groq key in .env (https://console.groq.com) — without it,
# chat replies with a placeholder message instead of an AI answer
docker compose up --build
```

- App: http://localhost:3000 (landing) → http://localhost:3000/app (workspace)
- API: http://localhost:8000/docs (interactive Swagger UI)
- Qdrant dashboard: http://localhost:6333/dashboard

## Try the working RAG loop

1. Register a user via `POST /api/auth/login` isn't enough on its own — call
   `POST /api/auth/register` first (Swagger UI at `/docs` is easiest).
2. Copy the returned `access_token` into `localStorage.ivision_token` in the
   browser devtools console: `localStorage.setItem('ivision_token', 'TOKEN')`
3. Go to `/app` → Knowledge → upload a PDF or TXT file.
4. Go to Chats → New Chat → ask a question about the file's contents.

(A login screen in the UI is the natural next thing to add — this pass
focused on getting the pipeline itself real and working end-to-end.)

## Folder structure

```
ivision/
├── frontend/                  # Next.js + TS + Tailwind + Framer Motion
│   ├── app/
│   │   ├── page.tsx           # Landing hero (matches reference image)
│   │   └── app/page.tsx       # Workspace: sidebar + chat
│   ├── components/
│   └── lib/api.ts             # Typed API client
├── backend/
│   └── app/
│       ├── core/              # config, JWT security
│       ├── db/                # SQLAlchemy session
│       ├── models/            # Full schema (14 tables)
│       ├── schemas/           # Pydantic request/response models
│       ├── services/          # embeddings, vectorstore, rag, groq, extraction
│       └── api/routes/        # auth, chat, knowledge, integrations, search
└── docker-compose.yml         # postgres + qdrant + backend + frontend
```
