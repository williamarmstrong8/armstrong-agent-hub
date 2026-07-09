"use client";

import { motion } from "motion/react";

export function Bars({
  data,
  accent = "#0a7cff",
  height = 72,
  format,
}: {
  data: { label: string; value: number }[];
  accent?: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * (height - 22), 3);
        return (
          <div key={d.label + i} className="group flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex flex-1 w-full items-end justify-center">
              <motion.div
                className="w-full max-w-[26px] rounded-md nu-raised-sm"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: h, opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: `linear-gradient(180deg, ${accent}, color-mix(in srgb, ${accent} 55%, #ffffff))`,
                }}
              >
                <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {format ? format(d.value) : d.value}
                </span>
              </motion.div>
            </div>
            <span className="text-[10px] text-muted-2">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
