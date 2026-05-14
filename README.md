# MindPatch

Autonomous Cognitive Debugger for DSA Students.

MindPatch is not another answer generator. It listens to a student's spoken DSA reasoning, finds the hidden bug in the mental model, remembers repeated mistake patterns, and turns the failure into Socratic repair plus targeted practice.

## Judge Summary

Most AI tutors optimize for getting the final answer. MindPatch optimizes for debugging the student's thinking.

In the demo, a student tries to solve Longest Substring by sorting the string. A normal tutor would explain sliding window. MindPatch does something more valuable:

1. Captures the spoken reasoning.
2. Reconstructs the student's mental steps.
3. Finds the constraint misunderstanding.
4. Retrieves a similar past mistake from Two Sum.
5. Asks the Socratic repair question.
6. Generates a personalized training plan.

That makes the product a cognitive debugger, not a chatbot.

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

- **Omi = ambient reasoning capture.** The student explains their approach out loud while solving; MindPatch receives the transcript through `/api/omi/webhook` or the manual/demo input.
- **Lyzr = autonomous agent orchestration.** MindPatch models the workflow as specialized agents for cleaning, tracing, classifying, retrieving memory, coaching, and planning.
- **Hugging Face = live model execution + embeddings.** When `HF_TOKEN` or `HUGGINGFACE_API_KEY` is present, the same agents call a real Hugging Face chat model, and mistake memories can be embedded with Hugging Face feature extraction.
- **Qdrant = long-term cognitive mistake memory.** Mistakes are embedded semantically and stored in Qdrant Cloud so the system can replay similar prior failures across DSA topics.

If credentials are missing, the app still works:

- Missing Lyzr and Hugging Face credentials activate realistic mock agent outputs.
- Missing Qdrant credentials activate local dynamic vector memory.
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
- Hugging Face model adapter for live DSA reasoning analysis
- Qdrant adapter with mock vector memory

## Architecture

```text
Omi -> MindPatch Backend -> Lyzr/Hugging Face Agents -> Qdrant Memory -> Dashboard
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
AGENT_PROVIDER=auto
LYZR_API_KEY=
LYZR_AGENT_ID=
HF_TOKEN=
HUGGINGFACE_API_KEY=
HUGGINGFACE_HUB_TOKEN=
HUGGINGFACE_MODEL=google/gemma-4-31B-it
HUGGINGFACE_API_BASE=https://router.huggingface.co/v1
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_EMBEDDING_API_BASE=https://router.huggingface.co
QDRANT_URL=
QDRANT_API_KEY=
OPENAI_API_KEY=
```

### Live Hugging Face Mode

To run MindPatch with a real Hugging Face model:

1. Create a Hugging Face token with permission to make Inference Provider calls.
2. Add it to `.env.local` as `HF_TOKEN=...` or `HUGGINGFACE_API_KEY=...`.
3. Set `AGENT_PROVIDER=huggingface`.
4. Keep `HUGGINGFACE_MODEL=google/gemma-4-31B-it` for the hosted router.
5. Restart `npm run dev`.

The app badge will change to **Live HF Model** and arbitrary user transcripts will be analyzed by the Hugging Face model.

### Live Cloud AI + Vector DB Mode

To run the full cloud path:

```bash
AGENT_PROVIDER=huggingface
HF_TOKEN=your_hugging_face_token
HUGGINGFACE_MODEL=google/gemma-4-31B-it
HUGGINGFACE_API_BASE=https://router.huggingface.co/v1
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
HUGGINGFACE_EMBEDDING_API_BASE=https://router.huggingface.co
QDRANT_URL=https://your-qdrant-cluster-url
QDRANT_API_KEY=your_qdrant_api_key
```

With those variables set, the app uses:

- Hugging Face chat completions for the cognitive agents.
- Hugging Face feature extraction for 384-dimensional semantic embeddings.
- Qdrant Cloud collection `mindpatch_mistake_memory` for long-term memory search and storage.

The app badge will change to **Live Cloud AI + Vector DB**. Seed memories are upserted into Qdrant automatically, and new mistake sessions are stored in both local JSON and Qdrant Cloud.

The suggested `google/gemma-4-31B-it-assistant` model is an assistant/drafter checkpoint for Gemma speculative decoding. Its model card shows it is usable through Transformers/local apps, but the hosted Inference Providers path is available from the Gemma model page for `google/gemma-4-31B-it`. For a custom deployment, set:

```bash
HUGGINGFACE_API_BASE=http://localhost:8000/v1
HUGGINGFACE_MODEL=google/gemma-4-31B-it-assistant
```

Any OpenAI-compatible Hugging Face dedicated endpoint, local vLLM server, or router endpoint can be used through the same variables.

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

## What Was Weak Before

The first MVP worked, but a judge could miss the product thesis because:

- The landing page sounded like a polished tutor, not a cognitive debugger.
- The Omi/Lyzr/Qdrant roles were present but not unmistakable.
- The demo flow looked like a form submission instead of an autonomous system.
- The analysis page buried the verdict inside normal cards.
- The README explained setup before it sold the idea.

The current version fixes those issues by making the cognitive-debugging loop visible on the landing page, demo timeline, analysis verdict, memory replay, and README.

## Why It Wins

MindPatch shows a complete autonomous learning loop:

```text
Omi speech capture -> Lyzr/Hugging Face agent reasoning -> Qdrant mistake replay -> Socratic repair -> personalized practice -> progress score
```

That loop is the product. The answer is secondary.
