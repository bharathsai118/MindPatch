import { SessionForm } from "@/components/SessionForm";
import { getIntegrationStatus } from "@/lib/config";

export default async function SessionPage() {
  const status = getIntegrationStatus();

  return (
    <main className="dashboard-grid min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-signal">
              Reasoning session
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Speak your thinking. MindPatch debugs the pattern.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Paste a real transcript, code explanation, or Omi webhook output.
              The autonomous workflow reconstructs reasoning, checks complexity,
              retrieves mistake memory, and produces a targeted repair plan.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-soft">
            {status.demoMode
              ? "Local fallback: no live agent key configured"
              : `${status.modeLabel}: ${status.agentModel} + ${status.memoryProvider === "qdrant" ? "Qdrant" : "local memory"} + ${status.embeddingModel}`}
          </div>
        </div>
        <SessionForm />
      </section>
    </main>
  );
}
