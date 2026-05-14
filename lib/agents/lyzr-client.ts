import { getIntegrationStatus } from "@/lib/config";
import { extractJson, isRecord } from "@/lib/agents/json-utils";

type LyzrResponse = {
  response?: string;
  message?: string;
  output?: unknown;
};

export async function invokeLyzrJson<T>(args: {
  agentName: string;
  sessionId: string;
  prompt: string;
}): Promise<T | null> {
  if (!getIntegrationStatus().lyzrConfigured) {
    return null;
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

    if (!response.ok) return null;

    const body = (await response.json()) as LyzrResponse;
    if (isRecord(body.output)) {
      return body.output as T;
    }

    const text = body.response ?? body.message ?? "";
    const parsed = extractJson(text);
    return parsed ? (parsed as T) : null;
  } catch {
    return null;
  }
}
