"use client";

import { motion } from "motion/react";
import { useId } from "react";

export function Sparkline({
  data,
  accent = "#0a7cff",
  width = 160,
  height = 44,
}: {
  data: number[];
  accent?: string;
  width?: number;
  height?: number;
}) {
  const id = useId();
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={accent} />
    </svg>
  );
}
