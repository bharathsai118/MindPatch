import { ProgressDashboard } from "@/components/ProgressDashboard";
import { getProgressData } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const progress = await getProgressData();

  return (
    <main className="dashboard-grid min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amberline">
            Progress model
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cognitive Progress Score
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            A local analytics layer summarizes repeated mistake categories,
            recent sessions, and next-best improvement suggestions.
          </p>
        </div>
        <ProgressDashboard progress={progress} />
      </section>
    </main>
  );
}
