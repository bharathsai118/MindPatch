import {
  getHuggingFaceBaseUrl,
  getHuggingFaceModel,
  getHuggingFaceToken,
  getIntegrationStatus
} from "@/lib/config";
import { extractJson } from "@/lib/agents/json-utils";

type HuggingFaceChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
    text?: string;
  }>;
  error?: unknown;
};

function buildSystemPrompt(agentName: string) {
  return [
    `You are the ${agentName} in MindPatch, an autonomous cognitive debugger for DSA students.`,
    "Your job is to analyze the student's reasoning, not dump final code answers.",
    "Return one valid JSON object only. Do not include markdown, prose outside JSON, or comments.",
    "Use concise, judge-ready language grounded in the transcript evidence."
  ].join(" ");
}

export async function invokeHuggingFaceJson<T>(args: {
  agentName: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<T | null> {
  if (!getIntegrationStatus().huggingFaceConfigured) {
    return null;
  }

  const token = getHuggingFaceToken();
  const baseUrl = getHuggingFaceBaseUrl().replace(/\/$/, "");
  const model = getHuggingFaceModel();

  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = args.timeoutMs ? new AbortController() : undefined;
    timeout = args.timeoutMs
      ? setTimeout(() => controller?.abort(), args.timeoutMs)
      : undefined;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller?.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(args.agentName)
          },
          {
            role: "user",
            content: args.prompt
          }
        ]
      })
    });

    if (!response.ok) return null;

    const body = (await response.json()) as HuggingFaceChatResponse;
    const content =
      body.choices?.[0]?.message?.content ?? body.choices?.[0]?.text ?? "";
    const parsed = extractJson(content);

    return parsed ? (parsed as T) : null;
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
