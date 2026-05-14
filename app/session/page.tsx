import { SessionForm } from "@/components/SessionForm";
import { getIntegrationStatus } from "@/lib/config";

type SessionPageProps = {
  searchParams?: Promise<{
    demo?: string;
    judge?: string;
  }>;
};

export default async function SessionPage({ searchParams }: SessionPageProps) {
  const params = (await searchParams) ?? {};
  const status = getIntegrationStatus();
  const isJudgeDemo = params.judge === "1";

  return (
    <main className="dashboard-grid min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-signal">
              Reasoning session
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {isJudgeDemo
                ? "Judge Demo Mode: watch MindPatch debug a hidden DSA mistake."
                : "Speak your thinking. MindPatch debugs the pattern."}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {isJudgeDemo
                ? "The demo auto-runs a flawed Longest Substring transcript through transcript cleaning, reasoning trace, memory replay, Socratic repair, and a final training plan."
                : "Paste a transcript, use the demo transcript, or post to the Omi webhook. The same autonomous workflow produces the analysis."}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-soft">
            {status.demoMode
              ? "Demo Mode: mock Lyzr and memory adapters are active"
              : "Live integrations configured"}
          </div>
        </div>
        <SessionForm
          initialDemo={params.demo === "1"}
          judgeDemo={isJudgeDemo}
        />
      </section>
    </main>
  );
}
