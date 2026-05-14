export type IntegrationStatus = {
  omiConfigured: boolean;
  lyzrConfigured: boolean;
  qdrantConfigured: boolean;
  embeddingConfigured: boolean;
  demoMode: boolean;
};

export function getIntegrationStatus(): IntegrationStatus {
  const omiConfigured = Boolean(process.env.OMI_WEBHOOK_SECRET);
  const lyzrConfigured = Boolean(process.env.LYZR_API_KEY && process.env.LYZR_AGENT_ID);
  const qdrantConfigured = Boolean(process.env.QDRANT_URL);
  const embeddingConfigured = Boolean(process.env.OPENAI_API_KEY);

  return {
    omiConfigured,
    lyzrConfigured,
    qdrantConfigured,
    embeddingConfigured,
    demoMode: !(omiConfigured && lyzrConfigured && qdrantConfigured)
  };
}
