import { createHash } from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embedText, VECTOR_SIZE } from "@/lib/embeddings";
import { SEED_MEMORIES } from "@/lib/demo-data";
import type { MistakeMemory, SimilarMemory } from "@/lib/types";
import type { MemorySearchInput, VectorMemoryAdapter } from "@/lib/vector/memory-adapter";
import { memoryToSemanticText } from "@/lib/vector/memory-text";

const COLLECTION_NAME = "mindpatch_mistake_memory";

type MemoryPayload = Omit<MistakeMemory, "id"> & {
  id?: string;
};

export class QdrantMemoryAdapter implements VectorMemoryAdapter {
  private client: QdrantClient;
  private collectionReady = false;
  private seedReady = false;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
  }

  private async ensureCollection() {
    if (this.collectionReady) return;

    try {
      await this.client.getCollection(COLLECTION_NAME);
    } catch {
      await this.client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine"
        }
      });
    }

    this.collectionReady = true;
    await this.ensureSeedMemories();
  }

  private toPointId(id: string) {
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return id;
    }

    const hash = createHash("sha256").update(id).digest("hex");
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(
      13,
      16
    )}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }

  private async upsertMemories(memories: MistakeMemory[]) {
    const points = await Promise.all(
      memories.map(async (memory) => ({
        id: this.toPointId(memory.id),
        vector: await embedText(memoryToSemanticText(memory)),
        payload: memory
      }))
    );

    await this.client.upsert(COLLECTION_NAME, {
      wait: true,
      points
    });
  }

  private async ensureSeedMemories() {
    if (this.seedReady) return;
    await this.upsertMemories(SEED_MEMORIES);
    this.seedReady = true;
  }

  async searchMemories(input: MemorySearchInput): Promise<SimilarMemory[]> {
    await this.ensureCollection();
    const vector = await embedText(input.semanticText);
    const results = await this.client.search(COLLECTION_NAME, {
      vector,
      limit: Math.max(input.limit ?? 3, 24),
      with_payload: true
    });

    return results
      .map((result) => {
        const payload = result.payload as MemoryPayload;
        return {
          problem_name: payload.problem_name,
          mistake_type: payload.mistake_type,
          pattern: payload.mistake_summary,
          date: payload.created_at,
          similarity_score: Number(result.score.toFixed(2)),
          similarity_reason:
            payload.mistake_type === input.mistakeType
              ? "Qdrant returned this as a close vector match with the same mistake category."
              : "Qdrant returned this as a semantically close prior reasoning failure.",
          prior_repair: payload.socratic_question,
          lesson: payload.correct_pattern,
          confidence_signal: payload.confidence_signal
        };
      })
      .filter((memory) => memory.problem_name !== input.excludeProblemName)
      .slice(0, input.limit ?? 3);
  }

  async storeMemory(memory: MistakeMemory): Promise<void> {
    await this.ensureCollection();
    await this.upsertMemories([memory]);
  }
}
