# MindPatch

Autonomous Cognitive Debugger for DSA Students.

MindPatch is not a normal DSA tutor. It does not jump straight to the answer. It listens to how a student explains a solution, finds the hidden reasoning bug, remembers repeated mistake patterns, and produces a Socratic repair plus a personalized training plan.

## Problem

Students do not only need answers. They need to understand their repeated reasoning failures.

Common failure modes:

- Applying an algorithm before checking its preconditions.
- Optimizing before naming the invariant.
- Remembering a pattern but missing the problem constraint it must preserve.
- Getting the right topic but using the wrong mental model.

## Solution

MindPatch captures spoken reasoning, detects cognitive bugs, stores mistake memory, and generates personalized training plans.

The winning pitch:

> Most AI tools help students get answers. MindPatch helps students understand why they think wrong, remember those reasoning mistakes, and autonomously train them to improve.

## Judge Demo Mode

Click **Judge Demo Mode** on the home page or open:

```text
http://localhost:3000/session?judge=1
```

The app automatically runs the full demo:

1. Loads the Longest Substring problem.
2. Injects a flawed spoken transcript.
3. Runs the autonomous workflow timeline.
4. Retrieves similar past cognitive mistakes.
5. Produces a Cognitive Bug Report.
6. Generates Socratic Repair.
7. Creates an Autonomous Training Plan.

Demo transcript:

```text
I am solving longest substring without repeating characters. I think I can sort the string first and then remove duplicate adjacent characters. That should give me the longest unique substring.
```

Expected cognitive bug:

- Mistake type: `constraint_misunderstanding`
- Mistake: sorting destroys original substring order and contiguity
- Correct pattern: sliding window over original indices
- Socratic question: "What does the word substring require that sorting destroys?"
- Memory replay: similar Two Sum mistake where two pointers were used before checking sorted order

## Ecosystem Usage

- **Omi** captures spoken reasoning through ambient input and posts transcript payloads to `/api/omi/webhook`.
- **Lyzr AI** is represented as six logical reasoning agents in the backend workflow.
- **Qdrant** stores and retrieves long-term cognitive mistake memory.

If credentials are missing, the app still works:

- Missing Lyzr credentials activate realistic mock agent outputs.
- Missing Qdrant credentials activate local mock vector memory.
- Missing embedding credentials activate deterministic local embeddings.

This makes the hackathon demo reliable while still showing exactly where live integrations connect.

## Features

- Reasoning Trace
- Cognitive Bug Report
- Mistake Memory Replay
- Socratic Repair
- Autonomous Training Plan
- Cognitive Progress Score
- Judge Demo Mode
- Omi webhook endpoint
- Lyzr adapter with fallback workflow
- Qdrant adapter with mock vector memory

## Architecture

```text
Omi -> MindPatch Backend -> Lyzr Agents -> Qdrant Memory -> Dashboard
```

Workflow agents:

1. Transcript Cleaner Agent
2. Reasoning Trace Agent
3. Mistake Classifier Agent
4. Memory Retrieval Agent
5. Socratic Coach Agent
6. Training Plan Agent

## Run Locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux:

```bash
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

```bash
OMI_WEBHOOK_SECRET=
LYZR_API_KEY=
LYZR_AGENT_ID=
QDRANT_URL=
QDRANT_API_KEY=
OPENAI_API_KEY=
```

## API Routes

- `POST /api/session/analyze`
- `POST /api/omi/webhook`
- `GET /api/analysis/:sessionId`
- `GET /api/memory`
- `GET /api/progress`

Analyze payload:

```json
{
  "problem_name": "Longest Substring Without Repeating Characters",
  "problem_text": "Given a string s...",
  "transcript": "I am solving..."
}
```

## Memory Schema

Each stored mistake memory includes:

- user id
- session id
- problem name
- topic
- difficulty
- mistake type
- mistake summary
- spoken evidence
- correct pattern
- Socratic question
- confidence signal
- creation timestamp

Semantic memory text:

```text
Problem: [problem_name]
Topic: [topic]
Mistake: [mistake_summary]
Pattern: [mistake_type]
Evidence: [spoken_evidence]
Correct approach: [correct_pattern]
```

## Seed Memories

The demo starts with realistic past mistakes:

- **Two Sum**: student used two pointers without checking sorted order.
- **Number of Islands**: student explored only right and down, confusing coverage with deduplication.
- **Coin Change**: student assumed greedy always works.
- **Valid Parentheses**: student counted brackets instead of using stack order.
- **House Robber**: student wrote a recurrence without base cases.

## Validation

```bash
npm run typecheck
npm run build
```

Suggested smoke test:

1. Open `/session?judge=1`.
2. Let the auto-demo run.
3. Confirm the analysis page shows:
   - Reasoning Trace
   - Cognitive Bug Report
   - Mistake Memory Replay
   - Socratic Repair
   - Autonomous Training Plan
4. Open `/memory` and `/progress`.

## Why It Wins

MindPatch shows an autonomous learning loop:

```text
spoken reasoning -> cognitive bug -> memory replay -> Socratic repair -> personalized practice -> progress score
```

That loop is the product. The answer is secondary.
