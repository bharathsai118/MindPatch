import { createHash } from "crypto";
import {
  getHuggingFaceEmbeddingBaseUrl,
  getHuggingFaceEmbeddingModel,
  getHuggingFaceToken
} from "@/lib/config";

export const VECTOR_SIZE = 384;

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function deterministicEmbedding(text: string): number[] {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens =
    text
      .toLowerCase()
      .match(/[a-z0-9_]+/g)
      ?.slice(0, 512) ?? [];

  tokens.forEach((token, tokenIndex) => {
    const digest = createHash("sha256").update(`${token}:${tokenIndex}`).digest();
    for (let byteIndex = 0; byteIndex < digest.length; byteIndex += 2) {
      const bucket = digest[byteIndex] % VECTOR_SIZE;
      const signedValue = digest[byteIndex + 1] / 127.5 - 1;
      vector[bucket] += signedValue;
    }
  });

  return normalize(vector);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function meanPool(vectors: number[][]): number[] | null {
  if (vectors.length === 0) return null;
  const dimension = vectors[0]?.length ?? 0;
  if (!dimension || vectors.some((vector) => vector.length !== dimension)) {
    return null;
  }

  const pooled = Array.from({ length: dimension }, () => 0);
  vectors.forEach((vector) => {
    vector.forEach((value, index) => {
      pooled[index] += value;
    });
  });

  return pooled.map((value) => value / vectors.length);
}

function extractEmbedding(value: unknown): number[] | null {
  if (isNumberArray(value)) return value;
  if (!Array.isArray(value)) return null;

  if (value.length === 1) {
    return extractEmbedding(value[0]);
  }

  const vectors = value.filter(isNumberArray);
  if (vectors.length === value.length) {
    return meanPool(vectors);
  }

  const nestedVectors = value
    .map(extractEmbedding)
    .filter((item): item is number[] => Boolean(item));

  return meanPool(nestedVectors);
}

async function huggingFaceEmbedding(text: string): Promise<number[] | null> {
  const token = getHuggingFaceToken();
  if (!token) return null;

  const model = getHuggingFaceEmbeddingModel();
  const baseUrl = getHuggingFaceEmbeddingBaseUrl().replace(/\/$/, "");
  const endpoint = `${baseUrl}/hf-inference/models/${model}/pipeline/feature-extraction`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: text,
        normalize: true,
        truncate: true
      })
    });

    if (!response.ok) return null;

    const body = await response.json();
    const embedding = extractEmbedding(body);

    return embedding?.length === VECTOR_SIZE ? normalize(embedding) : null;
  } catch {
    return null;
  }
}

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    const huggingFaceVector = await huggingFaceEmbedding(text);
    return huggingFaceVector ?? deterministicEmbedding(text);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: VECTOR_SIZE
      })
    });

    if (!response.ok) {
      return deterministicEmbedding(text);
    }

    const body = (await response.json()) as {
      data?: Array<{
        embedding?: number[];
      }>;
    };
    const embedding = body.data?.[0]?.embedding;
    return embedding?.length === VECTOR_SIZE
      ? embedding
      : deterministicEmbedding(text);
  } catch {
    return deterministicEmbedding(text);
  }
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}
