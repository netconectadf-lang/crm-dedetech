import { cn } from "@/lib/utils";

/** Mini-gráfico de tendência (SVG puro, sem deps). Herda a cor via currentColor. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("w-full", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
