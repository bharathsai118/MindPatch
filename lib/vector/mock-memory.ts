import { cosineSimilarity, embedText } from "@/lib/embeddings";
import { getMemories } from "@/lib/storage/json-store";
import type { MemorySearchInput, VectorMemoryAdapter } from "@/lib/vector/memory-adapter";
import { memoryToSemanticText } from "@/lib/vector/memory-text";

export class MockMemoryAdapter implements VectorMemoryAdapter {
  async searchMemories(input: MemorySearchInput) {
    const queryVector = await embedText(input.semanticText);
    const memories = (await getMemories()).filter(
      (memory) => memory.problem_name !== input.excludeProblemName
    );

    const scored = await Promise.all(
      memories.map(async (memory) => {
        const memoryVector = await embedText(memoryToSemanticText(memory));
        const sameTypeBoost = memory.mistake_type === input.mistakeType ? 0.55 : 0;
        return {
          memory,
          score: cosineSimilarity(queryVector, memoryVector) + sameTypeBoost
        };
      })
    );

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? 3)
      .map(({ memory, score }) => ({
        problem_name: memory.problem_name,
        mistake_type: memory.mistake_type,
        pattern: memory.mistake_summary,
        date: memory.created_at,
        similarity_score: Math.min(0.97, Math.max(0.62, Number(score.toFixed(2)))),
        similarity_reason:
          memory.mistake_type === input.mistakeType
            ? "Same cognitive category and a similar precondition-check failure."
            : "Semantically similar reasoning pattern from prior mistake memory.",
        prior_repair: memory.socratic_question,
        lesson: memory.correct_pattern,
        confidence_signal: memory.confidence_signal
      }));
  }

  async storeMemory(_memory: unknown) {
    return Promise.resolve();
  }
}
