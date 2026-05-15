"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { AnalysisFeedbackValue } from "@/lib/types";

type AnalysisFeedbackButtonsProps = {
  sessionId: string;
  initialValue?: AnalysisFeedbackValue;
};

type FeedbackButtonProps = {
  active: boolean;
  disabled: boolean;
  label: string;
  tone: "like" | "dislike";
  onClick: () => void;
};

function FeedbackButton({
  active,
  disabled,
  label,
  tone,
  onClick
}: FeedbackButtonProps) {
  const Icon = tone === "like" ? ThumbsUp : ThumbsDown;
  const activeClass =
    tone === "like"
      ? "bg-emerald-400/15 text-emerald-300 ring-emerald-300/40"
      : "bg-red-400/15 text-red-300 ring-red-300/40";

  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 transition ${
        active
          ? activeClass
          : "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-white"
      } disabled:cursor-wait disabled:opacity-60`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    </button>
  );
}

export function AnalysisFeedbackButtons({
  sessionId,
  initialValue = null
}: AnalysisFeedbackButtonsProps) {
  const [value, setValue] = useState<AnalysisFeedbackValue>(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const saveFeedback = async (nextValue: AnalysisFeedbackValue) => {
    const previousValue = value;
    setValue(nextValue);
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/analysis/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ feedback: nextValue })
      });

      if (!response.ok) {
        throw new Error("Feedback was not saved.");
      }

      const updated = (await response.json()) as {
        feedback?: {
          value?: AnalysisFeedbackValue;
        };
      };
      setValue(updated.feedback?.value ?? null);
    } catch {
      setValue(previousValue);
      setError("Could not save feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeedback = (nextValue: Exclude<AnalysisFeedbackValue, null>) => {
    void saveFeedback(value === nextValue ? null : nextValue);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <FeedbackButton
          active={value === "like"}
          disabled={isSaving}
          label="Mark this analysis helpful"
          onClick={() => toggleFeedback("like")}
          tone="like"
        />
        <FeedbackButton
          active={value === "dislike"}
          disabled={isSaving}
          label="Mark this analysis not helpful"
          onClick={() => toggleFeedback("dislike")}
          tone="dislike"
        />
      </div>
      <p className="min-h-4 text-xs text-red-300" role="status">
        {error}
      </p>
    </div>
  );
}
