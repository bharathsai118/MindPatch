import {
  Check,
  ChevronDown,
  Code2,
  GitBranch,
  Wand2,
  Zap
} from "lucide-react";
import { AnalysisFeedbackButtons } from "@/components/AnalysisFeedbackButtons";
import { ComplexityGrowthChart } from "@/components/ComplexityGrowthChart";
import { formatComplexityLabel } from "@/lib/complexity-curve";
import type {
  AnalysisFeedbackValue,
  CodeComplexityAnalysis,
  MistakeReport
} from "@/lib/types";

type CodeComplexityCardProps = {
  analysis: CodeComplexityAnalysis;
  transcript: string;
  mistake: MistakeReport;
  sessionId: string;
  feedback?: AnalysisFeedbackValue;
};

function getPrimarySuggestion(analysis: CodeComplexityAnalysis) {
  const alreadyOptimal =
    analysis.current_time_complexity === analysis.optimized_time_complexity &&
    analysis.current_space_complexity === analysis.optimized_space_complexity &&
    analysis.optimized_time_score >= analysis.time_score &&
    analysis.optimized_space_score >= analysis.space_score;

  if (alreadyOptimal) {
    return "Strong efficiency achieved; the current solution is already close to optimal in both time and space.";
  }

  return (
    analysis.optimization_path[0]?.why_it_helps ||
    analysis.bottlenecks[0] ||
    "Use the suggested approach to reduce avoidable work while preserving correctness."
  );
}

function inferLanguage(transcript: string) {
  if (/class\s+Solution|#include|vector<|public:/i.test(transcript)) return "C++";
  if (/def\s+\w+\(|self\b|List\[/i.test(transcript)) return "Python";
  if (/function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|=>/i.test(transcript)) {
    return "TypeScript / JavaScript";
  }
  if (/public\s+class|static\s+|ArrayList|HashMap/i.test(transcript)) return "Java";
  return "Transcript";
}

function getCodeLines(transcript: string) {
  const lines = transcript
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""));
  const firstCodeLine = lines.findIndex((line) =>
    /class\s+Solution|#include|public:|def\s+\w+\(|function\s+\w+|while\s*\(|for\s*\(|return\s+/i.test(
      line
    )
  );

  if (firstCodeLine < 0) return [];
  return lines.slice(firstCodeLine).filter((line) => line.trim().length > 0);
}

function CodePreview({
  transcript,
  codeDetected
}: {
  transcript: string;
  codeDetected: boolean;
}) {
  const codeLines = getCodeLines(transcript);
  const visibleLines = codeLines.slice(0, 9);

  if (!codeDetected || codeLines.length === 0) {
    return (
      <section className="rounded-lg border border-white/10 bg-[#2a2b32] p-4 text-sm leading-6 text-slate-300">
        <div className="flex items-center gap-2 text-slate-400">
          <Code2 className="h-4 w-4" />
          <span className="font-semibold">Code</span>
          <span className="text-slate-500">|</span>
          <span>Algorithm transcript</span>
        </div>
        <p className="mt-3">
          No full code block was detected, so MindPatch analyzed the algorithmic
          reasoning from the transcript.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
        <Code2 className="h-4 w-4" />
        <span>Code</span>
        <span className="text-slate-600">|</span>
        <span>{inferLanguage(transcript)}</span>
      </div>
      <div className="overflow-hidden rounded-lg bg-[#303030] p-5 font-mono text-sm leading-6 text-slate-100">
        {visibleLines.map((line, index) => (
          <div className="grid grid-cols-[2rem_1fr] gap-3" key={`${line}-${index}`}>
            <span className="select-none text-right text-emerald-400/80">
              {index + 1}
            </span>
            <code className="whitespace-pre-wrap break-words">{line}</code>
          </div>
        ))}
        {codeLines.length > visibleLines.length ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-400">
            <ChevronDown className="h-4 w-4" />
            View more
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function CodeComplexityCard({
  analysis,
  transcript,
  mistake,
  sessionId,
  feedback = null
}: CodeComplexityCardProps) {
  const currentApproach =
    analysis.approach_current ||
    analysis.optimization_path[0]?.current ||
    "Inferred approach";
  const suggestedApproach =
    analysis.approach_suggested ||
    analysis.optimization_path[0]?.improved ||
    mistake.correct_pattern;
  const keyIdea =
    analysis.approach_key_idea ||
    analysis.complexity_reasoning[0] ||
    mistake.correct_pattern;
  const consideration =
    analysis.approach_consideration ||
    mistake.why_it_is_wrong ||
    "Can you prove the invariant before coding the next step?";
  const styleSuggestion =
    analysis.style_suggestions ||
    analysis.clean_code_hints[0] ||
    "Use descriptive variable names and keep the core invariant visible.";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-800 bg-[#1d1d21] text-white shadow-soft">
      <header className="flex flex-col gap-3 border-b border-white/10 bg-[#23232a] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-violet-300">
          {["Approach", "Efficiency", "Code Style"].map((item) => (
            <span className="inline-flex items-center gap-1.5" key={item}>
              <Check className="h-4 w-4" />
              {item}
            </span>
          ))}
        </div>
        <AnalysisFeedbackButtons
          initialValue={feedback}
          sessionId={sessionId}
        />
      </header>

      <div className="space-y-5 p-5">
        <p className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm leading-6 text-violet-200">
          {mistake.mistake_found
            ? "MindPatch found an approach risk and converted it into a repair path."
            : "Congratulations. MindPatch found sound reasoning and is reinforcing the approach, efficiency, and code style."}
        </p>

        <section className="rounded-lg bg-[#25222d] p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-violet-400">
            <GitBranch className="h-5 w-5" />
            Approach
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6">
            <p>
              <span className="text-slate-300">Current:</span>{" "}
              <strong>{currentApproach}</strong>
            </p>
            <p>
              <span className="text-slate-300">Suggested:</span>{" "}
              <strong className="text-emerald-400">{suggestedApproach}</strong>
            </p>
            <p>
              <span className="text-slate-300">Key Idea:</span>{" "}
              <strong>{keyIdea}</strong>
            </p>
            <p>
              <span className="text-slate-300">Consider:</span>{" "}
              <strong>{consideration}</strong>
            </p>
          </div>
        </section>

        <section className="grid gap-5 rounded-lg bg-[#25232c] p-5 xl:grid-cols-[1fr_0.95fr]">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-violet-400">
              <Zap className="h-5 w-5" />
              Efficiency
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6">
              <p>
                <span className="text-slate-300">Current complexity:</span>{" "}
                <strong className="font-serif text-lg italic">
                  {formatComplexityLabel(analysis.current_time_complexity)}
                </strong>
                <span className="text-slate-500"> time</span>
                <span className="text-slate-500"> / </span>
                <strong>
                  {formatComplexityLabel(analysis.current_space_complexity)}
                </strong>
                <span className="text-slate-500"> space</span>
              </p>
              <p>
                <span className="text-slate-300">Suggested complexity:</span>{" "}
                <strong className="font-serif text-lg italic text-emerald-400">
                  {formatComplexityLabel(analysis.optimized_time_complexity)}
                </strong>
                <span className="text-slate-500"> time</span>
                <span className="text-slate-500"> / </span>
                <strong className="text-emerald-400">
                  {formatComplexityLabel(analysis.optimized_space_complexity)}
                </strong>
                <span className="text-slate-500"> space</span>
              </p>
              <p>
                <span className="text-slate-300">Suggestions:</span>{" "}
                <strong>{getPrimarySuggestion(analysis)}</strong>
              </p>
            </div>
          </div>
          <ComplexityGrowthChart
            currentSpace={analysis.current_space_complexity}
            currentTime={analysis.current_time_complexity}
            suggestedSpace={analysis.optimized_space_complexity}
            suggestedTime={analysis.optimized_time_complexity}
          />
        </section>

        <CodePreview
          codeDetected={analysis.code_detected}
          transcript={transcript}
        />

        <section className="rounded-lg bg-[#23232d] p-5">
          <div className="flex items-center gap-2 text-lg font-semibold text-violet-400">
            <Wand2 className="h-5 w-5" />
            Code Style
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6">
            <p>
              <span className="text-slate-300">Readability:</span>{" "}
              <strong>{analysis.readability || "Good"}</strong>
            </p>
            <p>
              <span className="text-slate-300">Structure:</span>{" "}
              <strong>{analysis.structure || "Solid"}</strong>
            </p>
            <p>
              <span className="text-slate-300">Suggestions:</span>{" "}
              <strong>{styleSuggestion}</strong>
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
