import { createHash } from "crypto";

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

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    return deterministicEmbedding(text);
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
