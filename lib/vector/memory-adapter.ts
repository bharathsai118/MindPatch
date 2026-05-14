import type { MistakeMemory, SimilarMemory } from "@/lib/types";

export type MemorySearchInput = {
  semanticText: string;
  mistakeType?: string;
  excludeProblemName?: string;
  limit?: number;
};

export interface VectorMemoryAdapter {
  searchMemories(input: MemorySearchInput): Promise<SimilarMemory[]>;
  storeMemory(memory: MistakeMemory): Promise<void>;
}
