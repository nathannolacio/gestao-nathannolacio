// Arte decorativa da capa: grade com pontos + "sol" de linhas.
const STEP = 80;
const CELLS = 8;
const SIZE = STEP * CELLS;
const points = Array.from({ length: CELLS + 1 }, (_, i) => i * STEP);

// Células preenchidas (col, row) para dar textura à grade.
const filled: [number, number][] = [
  [1, 1], [2, 0], [4, 1], [5, 2], [0, 3], [3, 3], [6, 4], [2, 5], [5, 6], [7, 5],
];

export function CoverGrid() {
  return (
    <svg
      aria-hidden
      viewBox={`-4 -4 ${SIZE + 8} ${SIZE + 8}`}
      className="h-full w-full"
    >
      {filled.map(([c, r]) => (
        <rect
          key={`${c}-${r}`}
          x={c * STEP}
          y={r * STEP}
          width={STEP}
          height={STEP}
          className="fill-dourado/10"
        />
      ))}
      {points.map((p) => (
        <g key={p} className="stroke-grafite/15" strokeWidth={1}>
          <line x1={p} y1={0} x2={p} y2={SIZE} />
          <line x1={0} y1={p} x2={SIZE} y2={p} />
        </g>
      ))}
      {points.flatMap((x) =>
        points.map((y) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={2.5}
            className="fill-grafite/30"
          />
        )),
      )}
    </svg>
  );
}

export function Sunburst({ className = "" }: { className?: string }) {
  const rays = 28;
  return (
    <svg aria-hidden viewBox="-100 -100 200 200" className={className}>
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const long = i % 2 === 0;
        const r1 = 14;
        const r2 = long ? 92 : 70;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r1}
            y1={Math.sin(a) * r1}
            x2={Math.cos(a) * r2}
            y2={Math.sin(a) * r2}
            className="stroke-dourado"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <circle r={5} className="fill-dourado" />
    </svg>
  );
}
