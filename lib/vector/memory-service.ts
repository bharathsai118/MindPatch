import type { MistakeMemory, MistakeReport, MemoryReplay } from "@/lib/types";
import { getIntegrationStatus } from "@/lib/config";
import { saveMemory } from "@/lib/storage/json-store";
import { MockMemoryAdapter } from "@/lib/vector/mock-memory";
import { QdrantMemoryAdapter } from "@/lib/vector/qdrant-memory";
import type { VectorMemoryAdapter } from "@/lib/vector/memory-adapter";
import { memoryToSemanticText } from "@/lib/vector/memory-text";

let adapter: VectorMemoryAdapter | null = null;
const fallbackAdapter = new MockMemoryAdapter();

function getAdapter(): VectorMemoryAdapter {
  if (adapter) return adapter;
  adapter = getIntegrationStatus().qdrantConfigured
    ? new QdrantMemoryAdapter()
    : fallbackAdapter;
  return adapter;
}

export async function retrieveSimilarMistakes(
  currentMemoryLike: Pick<
    MistakeMemory,
    | "problem_name"
    | "topic"
    | "mistake_type"
    | "mistake_summary"
    | "spoken_evidence"
    | "correct_pattern"
  >
): Promise<MemoryReplay> {
  const semanticText = memoryToSemanticText({
    id: "query",
    user_id: "demo_user",
    session_id: "query",
    difficulty: "unknown",
    socratic_question: "",
    confidence_signal: "",
    created_at: new Date().toISOString(),
    ...currentMemoryLike
  });

  try {
    const similar_memories = await getAdapter().searchMemories({
      semanticText,
      mistakeType: currentMemoryLike.mistake_type,
      excludeProblemName: currentMemoryLike.problem_name,
      limit: 8
    });

    const pastProblemMemories = similar_memories.filter(
      (memory) => memory.problem_name !== currentMemoryLike.problem_name
    );

    if (pastProblemMemories.length > 0) {
      return { similar_memories: pastProblemMemories.slice(0, 3) };
    }

    if (similar_memories.length > 0) {
      return { similar_memories: similar_memories.slice(0, 3) };
    }
  } catch {
    const similar_memories = await fallbackAdapter.searchMemories({
      semanticText,
      mistakeType: currentMemoryLike.mistake_type,
      excludeProblemName: currentMemoryLike.problem_name,
      limit: 8
    });
    const pastProblemMemories = similar_memories.filter(
      (memory) => memory.problem_name !== currentMemoryLike.problem_name
    );
    return {
      similar_memories:
        pastProblemMemories.length > 0
          ? pastProblemMemories.slice(0, 3)
          : similar_memories.slice(0, 3)
    };
  }

  const similar_memories = await fallbackAdapter.searchMemories({
    semanticText,
    mistakeType: currentMemoryLike.mistake_type,
    excludeProblemName: currentMemoryLike.problem_name,
    limit: 8
  });
  const pastProblemMemories = similar_memories.filter(
    (memory) => memory.problem_name !== currentMemoryLike.problem_name
  );
  return {
    similar_memories:
      pastProblemMemories.length > 0
        ? pastProblemMemories.slice(0, 3)
        : similar_memories.slice(0, 3)
  };
}

export async function storeMistakeMemory(memory: MistakeMemory): Promise<void> {
  await saveMemory(memory);
  try {
    await getAdapter().storeMemory(memory);
  } catch {
    await fallbackAdapter.storeMemory(memory);
  }
}

export function buildMemoryFromAnalysis(args: {
  sessionId: string;
  userId: string;
  problemName: string;
  topic: string;
  difficulty: string;
  mistake: MistakeReport;
  socraticQuestion: string;
  createdAt: string;
}): MistakeMemory {
  return {
    id: crypto.randomUUID(),
    user_id: args.userId,
    session_id: args.sessionId,
    problem_name: args.problemName,
    topic: args.topic,
    difficulty: args.difficulty,
    mistake_type: args.mistake.mistake_type,
    mistake_summary: args.mistake.mistake_summary,
    spoken_evidence: args.mistake.evidence_from_transcript,
    correct_pattern: args.mistake.correct_pattern,
    socratic_question: args.socraticQuestion,
    confidence_signal:
      args.mistake.severity === "high"
        ? "High confidence language paired with an invalid assumption."
        : "Student showed uncertainty that can be repaired with targeted prompts.",
    created_at: args.createdAt
  };
}
