"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BrainCircuit, PlayCircle, Send, Trophy } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { WorkflowTimeline, type WorkflowStep } from "@/components/WorkflowTimeline";
import {
  DEMO_PROBLEM_NAME,
  DEMO_PROBLEM_TEXT,
  DEMO_TRANSCRIPT
} from "@/lib/demo-data";
import type { AnalysisResult } from "@/lib/types";

type SessionFormProps = {
  initialDemo?: boolean;
  judgeDemo?: boolean;
};

const workflowStages = [
  {
    label: "Transcript received",
    agent: "Omi Intake Adapter",
    description:
      "Captures the spoken reasoning transcript and normalizes it into a clean session payload.",
    artifact: "raw speech -> structured transcript"
  },
  {
    label: "Cleaner agent extracts intent",
    agent: "Transcript Cleaner Agent",
    description:
      "Identifies the student's intended algorithm, problem framing, and unstated assumptions.",
    artifact: "cleaned transcript + student intent"
  },
  {
    label: "Reasoning trace built",
    agent: "Reasoning Trace Agent",
    description:
      "Breaks the explanation into ordered mental steps so the bug can be localized.",
    artifact: "step-by-step cognitive trace"
  },
  {
    label: "Memory search running",
    agent: "Qdrant Memory Retrieval Agent",
    description:
      "Retrieves similar past mistakes from long-term vector memory and ranks them by pattern match.",
    artifact: "similar mistake memories"
  },
  {
    label: "Cognitive bug classified",
    agent: "Mistake Classifier Agent",
    description:
      "Detects the hidden reasoning failure, severity, transcript evidence, and correct pattern.",
    artifact: "cognitive bug report"
  },
  {
    label: "Repair plan generated",
    agent: "Socratic Coach + Training Plan Agents",
    description:
      "Produces the judge-facing Socratic repair question and personalized DSA training plan.",
    artifact: "repair prompt + autonomous training plan"
  }
];

const emptySteps: WorkflowStep[] = workflowStages.map((stage) => ({
  ...stage,
  status: "pending"
}));

export function SessionForm({
  initialDemo = false,
  judgeDemo = false
}: SessionFormProps) {
  const router = useRouter();
  const [problemName, setProblemName] = useState("");
  const [problemText, setProblemText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const judgeRunStarted = useRef(false);

  useEffect(() => {
    if (initialDemo || judgeDemo) {
      setProblemName(DEMO_PROBLEM_NAME);
      setProblemText(DEMO_PROBLEM_TEXT);
      setTranscript(DEMO_TRANSCRIPT);
    }
  }, [initialDemo, judgeDemo]);

  useEffect(() => {
    if (!judgeDemo) return;
    if (judgeRunStarted.current) return;
    judgeRunStarted.current = true;
    const timeout = window.setTimeout(() => {
      const payload = {
        problem_name: DEMO_PROBLEM_NAME,
        problem_text: DEMO_PROBLEM_TEXT,
        transcript: DEMO_TRANSCRIPT
      };
      void runAnalysis(payload);
    }, 700);
    return () => window.clearTimeout(timeout);
    // runAnalysis intentionally stays outside deps so Judge Demo fires once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judgeDemo]);

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

  const fillDemo = () => {
    setProblemName(DEMO_PROBLEM_NAME);
    setProblemText(DEMO_PROBLEM_TEXT);
    setTranscript(DEMO_TRANSCRIPT);
  };

  const runDemo = () => {
    const payload = {
      problem_name: DEMO_PROBLEM_NAME,
      problem_text: DEMO_PROBLEM_TEXT,
      transcript: DEMO_TRANSCRIPT
    };
    setProblemName(payload.problem_name);
    setProblemText(payload.problem_text);
    setTranscript(payload.transcript);
    void runAnalysis(payload);
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
        {judgeDemo ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">
                  Judge Demo Mode is running
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  MindPatch is replaying the full hackathon demo from transcript
                  intake to memory retrieval and final training plan.
                </p>
              </div>
            </div>
          </div>
        ) : null}

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
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={isLoading}
            onClick={runDemo}
            type="button"
          >
            <PlayCircle className="h-4 w-4" />
            Run Demo Transcript
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={isLoading}
            onClick={() => {
              window.location.href = "/session?judge=1";
            }}
            type="button"
          >
            <Trophy className="h-4 w-4" />
            Judge Demo Mode
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            disabled={isLoading}
            onClick={fillDemo}
            type="button"
          >
            Fill Demo Only
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <div className="card rounded-lg p-5 md:p-6">
          <h2 className="text-lg font-semibold text-ink">
            Autonomous Workflow Timeline
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The API route runs six logical agents and stores a semantic mistake
            memory after the analysis completes.
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
