export type AgentProvider = "lyzr" | "huggingface" | "mock";
export type EmbeddingProvider = "openai" | "huggingface" | "local";

export type IntegrationStatus = {
  omiConfigured: boolean;
  lyzrConfigured: boolean;
  huggingFaceConfigured: boolean;
  qdrantConfigured: boolean;
  embeddingConfigured: boolean;
  agentProvider: AgentProvider;
  agentModel: string;
  embeddingProvider: EmbeddingProvider;
  embeddingModel: string;
  memoryProvider: "qdrant" | "local";
  modeLabel: string;
  demoMode: boolean;
  cloudMode: boolean;
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

export function getHuggingFaceEmbeddingModel() {
  return (
    process.env.HUGGINGFACE_EMBEDDING_MODEL ??
    "sentence-transformers/all-MiniLM-L6-v2"
  );
}

export function getHuggingFaceEmbeddingBaseUrl() {
  return (
    process.env.HUGGINGFACE_EMBEDDING_API_BASE ??
    "https://router.huggingface.co"
  );
}

export function getIntegrationStatus(): IntegrationStatus {
  const omiConfigured = Boolean(process.env.OMI_WEBHOOK_SECRET);
  const lyzrConfigured = Boolean(process.env.LYZR_API_KEY && process.env.LYZR_AGENT_ID);
  const huggingFaceConfigured = Boolean(getHuggingFaceToken());
  const qdrantConfigured = Boolean(process.env.QDRANT_URL);
  const embeddingConfigured = Boolean(
    process.env.OPENAI_API_KEY || huggingFaceConfigured
  );
  const embeddingProvider: EmbeddingProvider = process.env.OPENAI_API_KEY
    ? "openai"
    : huggingFaceConfigured
      ? "huggingface"
      : "local";
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
  const embeddingModel =
    embeddingProvider === "openai"
      ? "text-embedding-3-small"
      : embeddingProvider === "huggingface"
        ? getHuggingFaceEmbeddingModel()
        : "deterministic local embeddings";
  const cloudMode =
    agentProvider !== "mock" &&
    qdrantConfigured &&
    embeddingProvider !== "local";
  const modeLabel =
    cloudMode
      ? "Live Cloud AI + Vector DB"
      : agentProvider === "huggingface"
      ? "Live HF Model"
      : agentProvider === "lyzr"
        ? "Live Lyzr Agents"
        : "Local Fallback";

  return {
    omiConfigured,
    lyzrConfigured,
    huggingFaceConfigured,
    qdrantConfigured,
    embeddingConfigured,
    agentProvider,
    agentModel,
    embeddingProvider,
    embeddingModel,
    memoryProvider: qdrantConfigured ? "qdrant" : "local",
    modeLabel,
    demoMode: agentProvider === "mock",
    cloudMode
  };
}
