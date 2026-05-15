"use client";

import { useMemo, useState } from "react";
import {
  COMPLEXITY_SAMPLE_SIZES,
  buildComplexityComparison,
  formatComplexityLabel,
  formatOperationCount,
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

const CHART = {
  bottom: 138,
  height: 106,
  left: 58,
  top: 18,
  width: 228
};

const TICK_RATIOS = [0, 0.25, 0.5, 0.75, 1] as const;

function chartPath(points: ComplexityCurvePoint[]) {
  return points
    .map((point, index) => {
      const x =
        CHART.left +
        (index / Math.max(points.length - 1, 1)) * CHART.width;
      const y =
        CHART.bottom - Math.min(point.normalizedValue, 1) * CHART.height;

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${Math.max(
        CHART.top,
        y
      ).toFixed(1)}`;
    })
    .join(" ");
}

function chartPoint(point: ComplexityCurvePoint, index: number, count: number) {
  return {
    x: CHART.left + (index / Math.max(count - 1, 1)) * CHART.width,
    y: Math.max(
      CHART.top,
      CHART.bottom - Math.min(point.normalizedValue, 1) * CHART.height
    )
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
            aria-label={`N=${point.inputSize}, operations=${formatOperationCount(
              point.operations
            )}`}
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
            Select a curve to see calculated Big-O operation estimates for each
            sampled input size.
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
        viewBox="0 0 330 178"
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
          d={`M${CHART.left} ${CHART.bottom}H306`}
          markerEnd="url(#mindpatch-axis-arrow)"
          stroke="#94a3b8"
          strokeWidth="1.6"
        />
        <path
          d={`M${CHART.left} ${CHART.bottom}V14`}
          markerEnd="url(#mindpatch-axis-arrow)"
          stroke="#94a3b8"
          strokeWidth="1.6"
        />
        {TICK_RATIOS.map((ratio) => {
          const y = CHART.bottom - ratio * CHART.height;
          return (
            <g key={ratio}>
              {ratio > 0 ? (
                <path
                  d={`M${CHART.left} ${y.toFixed(1)}H300`}
                  stroke="#353843"
                  strokeDasharray="4 6"
                  strokeWidth="1"
                />
              ) : null}
              <text
                fill="#94a3b8"
                fontSize="8.5"
                textAnchor="end"
                x={CHART.left - 7}
                y={y + 3}
              >
                {formatOperationCount(comparison.maxOperations * ratio)}
              </text>
            </g>
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

        <text fill="#cbd5e1" fontSize="10" fontWeight="700" x="72" y="29">
          {selected === "current" ? "Current" : "Suggested"}{" "}
          {activeSeries.normalizedLabel}
        </text>
        <text
          fill="#94a3b8"
          fontSize="9"
          transform="rotate(-90 18 88)"
          x="18"
          y="88"
        >
          calculated operations
        </text>
        <text fill="#94a3b8" fontSize="9" textAnchor="middle" x="182" y="170">
          input size
        </text>
        <text fill="#94a3b8" fontSize="9" x={CHART.left - 1} y="154">
          N={COMPLEXITY_SAMPLE_SIZES[0]}
        </text>
        <text fill="#94a3b8" fontSize="9" textAnchor="end" x="300" y="154">
          N={COMPLEXITY_SAMPLE_SIZES[COMPLEXITY_SAMPLE_SIZES.length - 1]}
        </text>
      </svg>

      <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/35 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Calculated values
          </p>
          <p className="text-xs text-slate-500">
            {activeSeries.normalizedLabel}: sampled estimated operations
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Multi-input labels such as O(N + M) assume M grows with N for this
          comparison.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {activeSeries.points.map((point) => (
            <div
              className="rounded-md border border-white/10 bg-[#24252d] px-3 py-2"
              key={point.inputSize}
            >
              <p className="text-[11px] font-semibold text-slate-500">
                N={point.inputSize}
              </p>
              <p
                className={`mt-1 font-mono text-sm font-bold ${
                  selected === "suggested" ? "text-emerald-300" : "text-white"
                }`}
              >
                {formatOperationCount(point.operations)}
              </p>
            </div>
          ))}
        </div>
      </div>

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
