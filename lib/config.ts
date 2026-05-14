export type AgentProvider = "lyzr" | "huggingface" | "mock";

export type IntegrationStatus = {
  omiConfigured: boolean;
  lyzrConfigured: boolean;
  huggingFaceConfigured: boolean;
  qdrantConfigured: boolean;
  embeddingConfigured: boolean;
  agentProvider: AgentProvider;
  agentModel: string;
  modeLabel: string;
  demoMode: boolean;
};

export function getHuggingFaceToken() {
  return (
    process.env.HF_TOKEN ??
    process.env.HUGGINGFACE_API_KEY ??
    process.env.HUGGINGFACE_HUB_TOKEN ??
    ""
  );
}

function getRequestedAgentProvider(): AgentProvider | "auto" {
  const provider = process.env.AGENT_PROVIDER?.toLowerCase();

  if (provider === "lyzr" || provider === "huggingface" || provider === "mock") {
    return provider;
  }

  return "auto";
}

export function getHuggingFaceModel() {
  return process.env.HUGGINGFACE_MODEL ?? "google/gemma-4-31B-it";
}

export function getHuggingFaceBaseUrl() {
  return process.env.HUGGINGFACE_API_BASE ?? "https://router.huggingface.co/v1";
}

export function getIntegrationStatus(): IntegrationStatus {
  const omiConfigured = Boolean(process.env.OMI_WEBHOOK_SECRET);
  const lyzrConfigured = Boolean(process.env.LYZR_API_KEY && process.env.LYZR_AGENT_ID);
  const huggingFaceConfigured = Boolean(getHuggingFaceToken());
  const qdrantConfigured = Boolean(process.env.QDRANT_URL);
  const embeddingConfigured = Boolean(
    process.env.OPENAI_API_KEY || huggingFaceConfigured
  );
  const requestedProvider = getRequestedAgentProvider();
  const agentProvider =
    requestedProvider === "lyzr" && lyzrConfigured
      ? "lyzr"
      : requestedProvider === "huggingface" && huggingFaceConfigured
        ? "huggingface"
        : requestedProvider === "mock"
          ? "mock"
          : lyzrConfigured
            ? "lyzr"
            : huggingFaceConfigured
              ? "huggingface"
              : "mock";
  const agentModel =
    agentProvider === "huggingface"
      ? getHuggingFaceModel()
      : agentProvider === "lyzr"
        ? process.env.LYZR_AGENT_ID ?? "Lyzr agent"
        : "mock cognitive agents";
  const modeLabel =
    agentProvider === "huggingface"
      ? "Live HF Model"
      : agentProvider === "lyzr"
        ? "Live Lyzr Agents"
        : "Demo Mode";

  return {
    omiConfigured,
    lyzrConfigured,
    huggingFaceConfigured,
    qdrantConfigured,
    embeddingConfigured,
    agentProvider,
    agentModel,
    modeLabel,
    demoMode: agentProvider === "mock"
  };
}
