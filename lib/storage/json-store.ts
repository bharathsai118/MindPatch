import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { SEED_MEMORIES } from "@/lib/demo-data";
import type { AnalysisResult, MistakeMemory } from "@/lib/types";

type MindPatchDb = {
  analyses: AnalysisResult[];
  memories: MistakeMemory[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mindpatch-db.json");

function defaultDb(): MindPatchDb {
  return {
    analyses: [],
    memories: SEED_MEMORIES
  };
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
  const parsed = JSON.parse(raw) as Partial<MindPatchDb>;
  return {
    analyses: parsed.analyses ?? [],
    memories: parsed.memories ?? SEED_MEMORIES
  };
}

async function writeDb(db: MindPatchDb): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function saveAnalysis(analysis: AnalysisResult): Promise<void> {
  const db = await readDb();
  const existingIndex = db.analyses.findIndex(
    (item) => item.session_id === analysis.session_id
  );
  if (existingIndex >= 0) {
    db.analyses[existingIndex] = analysis;
  } else {
    db.analyses.push(analysis);
  }
  await writeDb(db);
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

export async function saveMemory(memory: MistakeMemory): Promise<void> {
  const db = await readDb();
  const existingIndex = db.memories.findIndex((item) => item.id === memory.id);
  if (existingIndex >= 0) {
    db.memories[existingIndex] = memory;
  } else {
    db.memories.push(memory);
  }
  await writeDb(db);
}

export async function getMemories(): Promise<MistakeMemory[]> {
  const db = await readDb();
  return db.memories;
}
