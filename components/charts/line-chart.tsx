"use client";

import { useId, useState } from "react";
import { useWidth } from "@/components/charts/use-width";

export interface Point {
  label: string;
  value: number;
}

interface LineChartProps {
  data: Point[];
  height?: number;
  format?: (v: number) => string;
  ariaLabel: string;
}

const PAD = { top: 24, right: 12, bottom: 22, left: 12 };

/** Minimal, touch-friendly area/line chart. Tap or hover a point to inspect it. */
export function LineChart({ data, height = 160, format = String, ariaLabel }: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gid = useId();

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(1, max * 0.1);
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`;
  const shown = active ?? data.length - 1;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {width > 0 && data.length > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onPointerLeave={() => setActive(null)}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - rect.left - PAD.left;
            const i = data.length === 1 ? 0 : Math.round((px / innerW) * (data.length - 1));
            setActive(Math.max(0, Math.min(data.length - 1, i)));
          }}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={PAD.top + innerH * f}
              y2={PAD.top + innerH * f}
              stroke="white"
              strokeOpacity="0.05"
            />
          ))}
          {data.length > 1 && <path d={area} fill={`url(#${gid})`} />}
          {data.length > 1 && (
            <path
              d={line}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              className="[stroke-dasharray:1] [stroke-dashoffset:1] motion-safe:animate-[draw_0.9s_ease-out_forwards] motion-reduce:[stroke-dashoffset:0]"
            />
          )}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(d.value)}
              r={i === shown ? 5 : 2.5}
              fill={i === shown ? "var(--primary)" : "var(--background)"}
              stroke="var(--primary)"
              strokeWidth="2"
            />
          ))}
          <text
            x={Math.min(Math.max(x(shown), PAD.left + 30), width - PAD.right - 30)}
            y={Math.max(14, y(data[shown].value) - 12)}
            textAnchor="middle"
            className="fill-foreground text-[12px] font-semibold"
          >
            {format(data[shown].value)}
          </text>
          <text x={PAD.left} y={height - 4} className="fill-muted-foreground text-[11px]">
            {data[0].label}
          </text>
          {data.length > 1 && (
            <text x={width - PAD.right} y={height - 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {data[data.length - 1].label}
            </text>
          )}
        </svg>
      )}
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}
