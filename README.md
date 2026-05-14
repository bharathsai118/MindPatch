# MindPatch

## Problem
Students do not only need answers. They need to understand their repeated reasoning failures.

## Solution
MindPatch captures spoken reasoning, detects cognitive bugs, stores mistake memory, and generates personalized training plans.

## Ecosystem Usage
- Omi: captures spoken reasoning through ambient input/webhook.
- Lyzr AI: orchestrates multiple reasoning agents.
- Qdrant: stores and retrieves long-term cognitive mistake memory.

When credentials are missing, MindPatch switches to demo-safe mock adapters. The app still runs locally, the same API routes work, and the code clearly marks the integration boundaries.

## Features
- Reasoning Trace
- Cognitive Bug Report
- Mistake Memory Replay
- Socratic Repair
- Autonomous Training Plan
- Cognitive Progress Score

## Architecture
Omi → MindPatch Backend → Lyzr Agents → Qdrant Memory → Dashboard

## Run Locally
```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux, use:

```bash
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables
```bash
OMI_WEBHOOK_SECRET=
LYZR_API_KEY=
LYZR_AGENT_ID=
QDRANT_URL=
QDRANT_API_KEY=
OPENAI_API_KEY=
```

If `LYZR_API_KEY` or `LYZR_AGENT_ID` are missing, `lib/agents/lyzr-client.ts` routes each logical agent to realistic mock output. If `QDRANT_URL` is missing, `lib/vector/mock-memory.ts` provides deterministic vector-like retrieval over local JSON memory. If `OPENAI_API_KEY` is missing, MindPatch uses deterministic local embeddings so memory search still works.

## Demo Flow
1. Open `/session` or click **Run Demo**.
2. Use the demo problem: **Longest Substring Without Repeating Characters**.
3. Demo transcript:

```text
I’m solving longest substring without repeating characters. I think I can sort the string first and then remove duplicate adjacent characters. That should give me the longest unique substring.
```

4. MindPatch detects:
- Mistake type: `constraint_misunderstanding`
- Mistake: sorting destroys original substring order
- Correct pattern: sliding window
- Socratic question: “What does the word substring require that sorting destroys?”
- Memory replay: similar Two Sum mistake where two pointers were used without checking sortedness
- Training plan: Longest Substring Without Repeating Characters, Permutation in String, Minimum Window Substring

## API Routes
- `POST /api/session/analyze`
- `POST /api/omi/webhook`
- `GET /api/analysis/:sessionId`
- `GET /api/memory`
- `GET /api/progress`

## Local Storage
The MVP uses `data/mindpatch-db.json` for saved analyses and mistake memories. The file is created automatically and seeded with three mock memories:
- Two Sum: two pointers used without checking sortedness.
- Number of Islands: only right/down traversal checked.
- Coin Change: greedy assumed to always work.

The storage layer is isolated in `lib/storage/json-store.ts`, so PostgreSQL or Supabase can be added later without changing the UI or agent workflow.
