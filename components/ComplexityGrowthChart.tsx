"use client";

import { useMemo, useState } from "react";
import {
  COMPLEXITY_SAMPLE_SIZES,
  buildComplexityComparison,
  formatComplexityLabel,
  type ComplexityCurvePoint,
  type ComplexityCurveSeries
} from "@/lib/complexity-curve";

type ComplexityView = "current" | "suggested";

type ComplexityGrowthChartProps = {
  currentTime: string;
  currentSpace: string;
  suggestedTime: string;
  suggestedSpace: string;
};

function chartPath(points: ComplexityCurvePoint[]) {
  const chart = {
    bottom: 138,
    height: 106,
    left: 38,
    top: 18,
    width: 248
  };

  return points
    .map((point, index) => {
      const x =
        chart.left +
        (index / Math.max(points.length - 1, 1)) * chart.width;
      const y = chart.bottom - Math.min(point.normalizedValue, 1) * chart.height;

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${Math.max(
        chart.top,
        y
      ).toFixed(1)}`;
    })
    .join(" ");
}

function chartPoint(point: ComplexityCurvePoint, index: number, count: number) {
  const left = 38;
  const top = 18;
  const width = 248;
  const bottom = 138;
  const height = 106;

  return {
    x: left + (index / Math.max(count - 1, 1)) * width,
    y: Math.max(top, bottom - Math.min(point.normalizedValue, 1) * height)
  };
}

function metricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "current" | "suggested";
}) {
  const isSuggested = tone === "suggested";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isSuggested
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-white/10 bg-slate-950/45"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 break-words font-serif text-2xl font-semibold italic leading-tight ${
          isSuggested ? "text-emerald-300" : "text-white"
        }`}
      >
        {formatComplexityLabel(value)}
      </p>
    </div>
  );
}

function toggleButton({
  active,
  label,
  value,
  onClick,
  tone
}: {
  active: boolean;
  label: string;
  value: string;
  onClick: () => void;
  tone: ComplexityView;
}) {
  const isSuggested = tone === "suggested";

  return (
    <button
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        active && isSuggested
          ? "bg-emerald-400/20 text-emerald-200 ring-2 ring-emerald-300/40"
          : active
            ? "bg-slate-100 text-slate-950 ring-2 ring-white/40"
            : "bg-slate-950/60 text-slate-300 ring-1 ring-white/10 hover:bg-slate-800"
      }`}
      onClick={onClick}
      type="button"
    >
      {label} {formatComplexityLabel(value)}
    </button>
  );
}

function drawSeries({
  active,
  series,
  tone
}: {
  active: boolean;
  series: ComplexityCurveSeries;
  tone: ComplexityView;
}) {
  const isSuggested = tone === "suggested";
  const color = isSuggested ? "#34d399" : "#f8fafc";

  return (
    <g key={tone} opacity={active ? 1 : 0.34}>
      <path
        d={chartPath(series.points)}
        fill="none"
        stroke={active ? color : "#94a3b8"}
        strokeDasharray={active ? undefined : "7 8"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 4.5 : 2.25}
      />
      {series.points.map((point, index) => {
        const coordinates = chartPoint(point, index, series.points.length);

        return (
          <circle
            cx={coordinates.x}
            cy={coordinates.y}
            fill={active ? color : "#64748b"}
            key={`${tone}-${point.inputSize}`}
            r={active ? 3 : 2}
          />
        );
      })}
    </g>
  );
}

export function ComplexityGrowthChart({
  currentTime,
  currentSpace,
  suggestedTime,
  suggestedSpace
}: ComplexityGrowthChartProps) {
  const [selected, setSelected] = useState<ComplexityView>("current");
  const comparison = useMemo(
    () => buildComplexityComparison(currentTime, suggestedTime),
    [currentTime, suggestedTime]
  );
  const activeSeries =
    selected === "current" ? comparison.current : comparison.suggested;
  const activeSpace = selected === "current" ? currentSpace : suggestedSpace;

  return (
    <div className="overflow-hidden rounded-lg bg-[#24252d] p-4">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Time and Space Complexity
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Select Current or Suggested to inspect the generated Big-O curve.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {toggleButton({
            active: selected === "current",
            label: "Current",
            value: currentTime,
            onClick: () => setSelected("current"),
            tone: "current"
          })}
          {toggleButton({
            active: selected === "suggested",
            label: "Suggested",
            value: suggestedTime,
            onClick: () => setSelected("suggested"),
            tone: "suggested"
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {metricCard({
            label: `${selected === "current" ? "Current" : "Suggested"} time`,
            value: activeSeries.label,
            tone: selected
          })}
          {metricCard({
            label: `${selected === "current" ? "Current" : "Suggested"} space`,
            value: activeSpace,
            tone: selected
          })}
        </div>
      </div>

      <svg
        aria-label={`${selected} time complexity ${activeSeries.normalizedLabel}`}
        className="mt-4 h-64 w-full"
        role="img"
        viewBox="0 0 310 178"
      >
        <defs>
          <marker
            id="mindpatch-axis-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="6"
            refY="3"
          >
            <path d="M0 0L6 3L0 6Z" fill="#94a3b8" />
          </marker>
        </defs>
        <path
          d="M38 138H292"
          markerEnd="url(#mindpatch-axis-arrow)"
          stroke="#94a3b8"
          strokeWidth="1.6"
        />
        <path
          d="M38 138V14"
          markerEnd="url(#mindpatch-axis-arrow)"
          stroke="#94a3b8"
          strokeWidth="1.6"
        />
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = 138 - ratio * 106;
          return (
            <path
              d={`M38 ${y.toFixed(1)}H286`}
              key={ratio}
              stroke="#353843"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          );
        })}

        {drawSeries({
          active: selected === "current",
          series: comparison.current,
          tone: "current"
        })}
        {drawSeries({
          active: selected === "suggested",
          series: comparison.suggested,
          tone: "suggested"
        })}

        <text fill="#cbd5e1" fontSize="10" fontWeight="700" x="52" y="29">
          {selected === "current" ? "Current" : "Suggested"}{" "}
          {activeSeries.normalizedLabel}
        </text>
        <text
          fill="#94a3b8"
          fontSize="9"
          transform="rotate(-90 14 88)"
          x="14"
          y="88"
        >
          operations
        </text>
        <text fill="#94a3b8" fontSize="9" textAnchor="middle" x="162" y="170">
          input size
        </text>
        <text fill="#94a3b8" fontSize="9" x="37" y="154">
          N={COMPLEXITY_SAMPLE_SIZES[0]}
        </text>
        <text fill="#94a3b8" fontSize="9" textAnchor="end" x="286" y="154">
          N={COMPLEXITY_SAMPLE_SIZES[COMPLEXITY_SAMPLE_SIZES.length - 1]}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-slate-100" />
          Current curve
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-emerald-400" />
          Suggested curve
        </span>
      </div>
    </div>
  );
}
