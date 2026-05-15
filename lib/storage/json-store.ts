import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { SEED_MEMORIES } from "@/lib/demo-data";
import type {
  AnalysisFeedbackValue,
  AnalysisResult,
  MistakeMemory
} from "@/lib/types";

type MindPatchDb = {
  analyses: AnalysisResult[];
  memories: MistakeMemory[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mindpatch-db.json");
const TMP_DB_PATH = path.join(DATA_DIR, "mindpatch-db.tmp.json");
let mutationQueue: Promise<void> = Promise.resolve();

function defaultDb(): MindPatchDb {
  return {
    analyses: [],
    memories: SEED_MEMORIES
  };
}

function mergeSeedMemories(memories: MistakeMemory[]): MistakeMemory[] {
  const userMemories = memories.filter((memory) => !memory.id.startsWith("seed-"));
  return [...SEED_MEMORIES, ...userMemories];
}

async function ensureDb(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
  }
}

async function readDb(): Promise<MindPatchDb> {
  await ensureDb();
  const raw = await readFile(DB_PATH, "utf8");
  let parsed: Partial<MindPatchDb>;
  try {
    parsed = JSON.parse(raw) as Partial<MindPatchDb>;
  } catch {
    const backupPath = path.join(
      DATA_DIR,
      `mindpatch-db.corrupt.${Date.now()}.json`
    );
    await rename(DB_PATH, backupPath).catch(() => undefined);
    const recovered = defaultDb();
    await writeDb(recovered);
    return recovered;
  }

  return {
    analyses: parsed.analyses ?? [],
    memories: mergeSeedMemories(parsed.memories ?? SEED_MEMORIES)
  };
}

async function writeDb(db: MindPatchDb): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TMP_DB_PATH, JSON.stringify(db, null, 2), "utf8");
  await rename(TMP_DB_PATH, DB_PATH);
}

async function mutateDb(mutator: (db: MindPatchDb) => void): Promise<void> {
  const nextMutation = mutationQueue.then(async () => {
    const db = await readDb();
    mutator(db);
    await writeDb(db);
  });

  mutationQueue = nextMutation.catch(() => undefined);
  return nextMutation;
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  await mutateDb((db) => {
    const existingIndex = db.analyses.findIndex(
      (item) => item.session_id === analysis.session_id
    );
    if (existingIndex >= 0) {
      db.analyses[existingIndex] = analysis;
    } else {
      db.analyses.push(analysis);
    }
  });
}

export async function getAnalysisById(
  sessionId: string
): Promise<AnalysisResult | null> {
  const db = await readDb();
  return db.analyses.find((analysis) => analysis.session_id === sessionId) ?? null;
}

export async function getAnalyses(): Promise<AnalysisResult[]> {
  const db = await readDb();
  return db.analyses;
}

export async function updateAnalysisFeedback(
  sessionId: string,
  value: AnalysisFeedbackValue
): Promise<AnalysisResult | null> {
  let updatedAnalysis: AnalysisResult | null = null;

  await mutateDb((db) => {
    const existingIndex = db.analyses.findIndex(
      (item) => item.session_id === sessionId
    );

    if (existingIndex < 0) return;

    const updatedAt = new Date().toISOString();
    updatedAnalysis = {
      ...db.analyses[existingIndex],
      feedback: {
        value,
        updated_at: updatedAt
      }
    };
    db.analyses[existingIndex] = updatedAnalysis;
  });

  return updatedAnalysis;
}

export async function saveMemory(memory: MistakeMemory): Promise<void> {
  await mutateDb((db) => {
    const existingIndex = db.memories.findIndex((item) => item.id === memory.id);
    if (existingIndex >= 0) {
      db.memories[existingIndex] = memory;
    } else {
      db.memories.push(memory);
    }
  });
}

export async function getMemories(): Promise<MistakeMemory[]> {
  const db = await readDb();
  return db.memories;
}
