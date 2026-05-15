import {
  Check,
  ChevronDown,
  Code2,
  GitBranch,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  Zap
} from "lucide-react";
import type { CodeComplexityAnalysis, MistakeReport } from "@/lib/types";

type CodeComplexityCardProps = {
  analysis: CodeComplexityAnalysis;
  transcript: string;
  mistake: MistakeReport;
};

function normalizeBigO(value: string) {
  return value.replace(/log10\s*n/gi, "log N").replace(/\bn\b/g, "N");
}

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

function ComplexityGraph({ label }: { label: string }) {
  return (
    <div className="relative min-h-36 overflow-hidden rounded-lg bg-[#24252d] p-4">
      <p className="absolute right-8 top-2 font-serif text-lg font-semibold italic text-white">
        {normalizeBigO(label)}
      </p>
      <svg
        aria-hidden="true"
        className="absolute bottom-3 right-4 h-32 w-44"
        viewBox="0 0 180 130"
      >
        <path d="M18 112H160" stroke="#3f414a" strokeWidth="1.5" />
        <path d="M18 112V8" stroke="#3f414a" strokeWidth="1.5" />
        <path
          d="M18 112C50 98 89 86 160 82"
          fill="none"
          stroke="#555862"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M18 112L160 8"
          fill="none"
          stroke="#a7abb6"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M18 112C40 72 50 35 60 8"
          fill="none"
          stroke="#5f626d"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M18 112C30 70 36 36 42 8"
          fill="none"
          stroke="#4a4d58"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path d="M18 118H160" stroke="#353740" strokeWidth="1.5" />
      </svg>
    </div>
  );
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
  mistake
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
        <div className="flex items-center gap-3 text-slate-400">
          <ThumbsUp className="h-4 w-4" />
          <ThumbsDown className="h-4 w-4" />
        </div>
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

        <section className="grid gap-5 rounded-lg bg-[#25232c] p-5 lg:grid-cols-[1fr_0.38fr]">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-violet-400">
              <Zap className="h-5 w-5" />
              Efficiency
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6">
              <p>
                <span className="text-slate-300">Current complexity:</span>{" "}
                <strong className="font-serif text-lg italic">
                  {normalizeBigO(analysis.current_time_complexity)}
                </strong>
                <span className="text-slate-500"> time</span>
                <span className="text-slate-500"> / </span>
                <strong>{normalizeBigO(analysis.current_space_complexity)}</strong>
                <span className="text-slate-500"> space</span>
              </p>
              <p>
                <span className="text-slate-300">Suggested complexity:</span>{" "}
                <strong className="font-serif text-lg italic text-emerald-400">
                  {normalizeBigO(analysis.optimized_time_complexity)}
                </strong>
                <span className="text-slate-500"> time</span>
                <span className="text-slate-500"> / </span>
                <strong className="text-emerald-400">
                  {normalizeBigO(analysis.optimized_space_complexity)}
                </strong>
                <span className="text-slate-500"> space</span>
              </p>
              <p>
                <span className="text-slate-300">Suggestions:</span>{" "}
                <strong>{getPrimarySuggestion(analysis)}</strong>
              </p>
            </div>
          </div>
          <ComplexityGraph label={analysis.optimized_time_complexity} />
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
