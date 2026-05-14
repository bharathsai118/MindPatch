import { invokeHuggingFaceJson } from "@/lib/agents/huggingface-client";
import { invokeLyzrJson } from "@/lib/agents/lyzr-client";
import { getIntegrationStatus } from "@/lib/config";

export async function invokeAgentJson<T>(args: {
  agentName: string;
  sessionId: string;
  prompt: string;
  fallback: () => Promise<T> | T;
}): Promise<T> {
  const status = getIntegrationStatus();

  if (status.agentProvider === "lyzr") {
    const lyzrOutput = await invokeLyzrJson<T>({
      agentName: args.agentName,
      sessionId: args.sessionId,
      prompt: args.prompt
    });

    if (lyzrOutput) return lyzrOutput;
    throw new Error(
      "Lyzr agent call failed. Check LYZR_API_KEY, LYZR_AGENT_ID, and agent access."
    );
  }

  if (status.agentProvider === "huggingface") {
    const huggingFaceOutput = await invokeHuggingFaceJson<T>({
      agentName: args.agentName,
      prompt: args.prompt
    });

    if (huggingFaceOutput) return huggingFaceOutput;
    throw new Error(
      "Hugging Face agent call failed. Check HF_TOKEN, HUGGINGFACE_MODEL, and Inference Provider access."
    );
  }

  return args.fallback();
}
