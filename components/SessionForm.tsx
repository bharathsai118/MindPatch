"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BrainCircuit, Send } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { WorkflowTimeline, type WorkflowStep } from "@/components/WorkflowTimeline";
import type { AnalysisResult } from "@/lib/types";

const workflowStages = [
  {
    label: "Transcript received",
    agent: "Omi Intake Adapter",
    description:
      "Receives ambient reasoning capture: spoken DSA explanation enters MindPatch without becoming an answer request.",
    artifact: "raw speech -> structured transcript"
  },
  {
    label: "Cleaner agent extracts intent",
    agent: "Transcript Cleaner Agent",
    description:
      "Finds the student's actual mental move, intended algorithm, and hidden assumptions from the transcript.",
    artifact: "cleaned transcript + student intent"
  },
  {
    label: "Reasoning trace built",
    agent: "Reasoning Trace Agent",
    description:
      "Turns the monologue into debuggable steps so the exact faulty transition can be isolated.",
    artifact: "step-by-step cognitive trace"
  },
  {
    label: "Memory search running",
    agent: "Qdrant Memory Retrieval Agent",
    description:
      "Searches long-term cognitive mistake memory for prior cases where a familiar algorithm was applied before checking preconditions.",
    artifact: "similar mistake memories"
  },
  {
    label: "Cognitive bug classified",
    agent: "Mistake Classifier Agent",
    description:
      "Names the hidden cognitive bug, cites transcript evidence, and explains which invariant or precondition broke.",
    artifact: "cognitive bug report"
  },
  {
    label: "Repair plan generated",
    agent: "Socratic Coach + Training Plan Agents",
    description:
      "Generates the repair question and practice sequence without dumping the final code answer.",
    artifact: "repair prompt + autonomous training plan"
  }
];

const emptySteps: WorkflowStep[] = workflowStages.map((stage) => ({
  ...stage,
  status: "pending"
}));

export function SessionForm() {
  const router = useRouter();
  const [problemName, setProblemName] = useState("");
  const [problemText, setProblemText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading) return;
    const interval = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, workflowStages.length - 1));
    }, 720);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  const steps = useMemo<WorkflowStep[]>(() => {
    return workflowStages.map((stage, index) => ({
      ...stage,
      status:
        index < activeStep ? "complete" : index === activeStep ? "active" : "pending"
    }));
  }, [activeStep]);

  const canSubmit =
    problemName.trim().length > 0 &&
    problemText.trim().length > 0 &&
    transcript.trim().length > 0 &&
    !isLoading;

  const runAnalysis = async (payload?: {
    problem_name: string;
    problem_text: string;
    transcript: string;
  }) => {
    const requestPayload = payload ?? {
      problem_name: problemName,
      problem_text: problemText,
      transcript
    };

    setError("");
    setIsLoading(true);
    setActiveStep(0);

    try {
      const response = await fetch("/api/session/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Analysis failed");
      }

      setActiveStep(workflowStages.length);
      const analysis = (await response.json()) as AnalysisResult;
      router.push(`/analysis/${analysis.session_id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed");
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        className="card rounded-lg p-5 md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void runAnalysis();
        }}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">DSA Reasoning Input</h2>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-700">Problem title</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink outline-none transition focus:border-signal focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setProblemName(event.target.value)}
            placeholder="Longest Substring Without Repeating Characters"
            value={problemName}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            Problem statement
          </span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-ink outline-none transition focus:border-signal focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setProblemText(event.target.value)}
            placeholder="Paste the DSA problem statement..."
            value={problemText}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            Student reasoning transcript
          </span>
          <textarea
            className="mt-2 min-h-44 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-ink outline-none transition focus:border-signal focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste spoken reasoning from Omi, or type the student explanation..."
            value={transcript}
          />
        </label>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={!canSubmit}
            type="submit"
          >
            <Send className="h-4 w-4" />
            Analyze My Thinking
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <div className="card rounded-lg p-5 md:p-6">
          <h2 className="text-lg font-semibold text-ink">
            Autonomous Workflow Timeline
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is the core product loop: capture the reasoning, orchestrate
            the agents, retrieve mistake memory, then repair the cognitive bug.
          </p>
          <div className="mt-5">
            <WorkflowTimeline steps={isLoading ? steps : emptySteps} />
          </div>
        </div>
        {isLoading ? <LoadingState /> : null}
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-blue-200">Omi webhook</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            POST ambient transcripts to <code>/api/omi/webhook</code>. When
            <code> OMI_WEBHOOK_SECRET</code> is set, include it as
            <code> x-omi-webhook-secret</code>.
          </p>
        </div>
      </aside>
    </div>
  );
}
