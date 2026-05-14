import { getIntegrationStatus } from "@/lib/config";

type LyzrResponse = {
  response?: string;
  message?: string;
  output?: unknown;
};

function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function invokeLyzrJson<T>(args: {
  agentName: string;
  sessionId: string;
  prompt: string;
  fallback: () => Promise<T> | T;
}): Promise<T> {
  if (!getIntegrationStatus().lyzrConfigured) {
    return args.fallback();
  }

  try {
    const response = await fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.LYZR_API_KEY ?? ""
      },
      body: JSON.stringify({
        user_id: "demo_user",
        agent_id: process.env.LYZR_AGENT_ID,
        session_id: args.sessionId,
        message: [
          `You are the ${args.agentName} in MindPatch, an autonomous DSA cognitive debugger.`,
          "Return valid JSON only. Do not include markdown.",
          args.prompt
        ].join("\n\n")
      })
    });

    if (!response.ok) return args.fallback();

    const body = (await response.json()) as LyzrResponse;
    if (typeof body.output === "object" && body.output) {
      return body.output as T;
    }

    const text = body.response ?? body.message ?? "";
    const parsed = extractJson(text);
    return parsed ? (parsed as T) : args.fallback();
  } catch {
    return args.fallback();
  }
}
