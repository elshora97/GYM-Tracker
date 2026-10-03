"use client";

import { useWidth } from "@/components/charts/use-width";
import type { Point } from "@/components/charts/line-chart";

interface BarChartProps {
  data: Point[];
  height?: number;
  ariaLabel: string;
  format?: (v: number) => string;
}

/** Simple column chart; the last bar (current period) is highlighted. */
export function BarChart({ data, height = 120, ariaLabel, format = String }: BarChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelH = 18;
  const valueH = 16;
  const innerH = height - labelH - valueH;
  const gap = 8;
  const barW = data.length ? (width - gap * (data.length - 1)) / data.length : 0;

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {data.map((d, i) => {
            const h = Math.max(d.value > 0 ? 4 : 2, (d.value / max) * innerH);
            const x = i * (barW + gap);
            const last = i === data.length - 1;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={valueH + innerH - h}
                  width={barW}
                  height={h}
                  rx={Math.min(6, barW / 3)}
                  fill={last ? "var(--primary)" : "white"}
                  fillOpacity={last ? 1 : d.value > 0 ? 0.16 : 0.06}
                  className="origin-bottom motion-safe:animate-[grow_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both]"
                  style={{ transformBox: "fill-box", animationDelay: `${i * 30}ms` }}
                />
                {d.value > 0 && (
                  <text
                    x={x + barW / 2}
                    y={valueH + innerH - h - 4}
                    textAnchor="middle"
                    className={last ? "fill-foreground text-[11px] font-semibold" : "fill-muted-foreground text-[10px]"}
                  >
                    {format(d.value)}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <style>{`@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}
