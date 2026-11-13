"use client";

import { useState } from "react";

export type ActivityPoint = { date: string; label: string; count: number };

// Gráfico de área: contatos registrados por dia. A área e a linha esticam com o card
// (preserveAspectRatio="none" + traço que não escala); o ponto e a dica do mouse são HTML
// posicionados em %, para não deformarem.
const W = 100;
const H = 100;

const periods = [7, 14, 30] as const;

// Recebe os últimos 30 dias; o seletor só recorta o fim da lista (sem nova consulta).
export function ActivityChart({ points: allPoints }: { points: ActivityPoint[] }) {
    const [days, setDays] = useState<(typeof periods)[number]>(14);
    const [hover, setHover] = useState<number | null>(null);
    const points = allPoints.slice(-days);
    const total = points.reduce((sum, point) => sum + point.count, 0);
    const best = points.reduce((top, point) => (point.count > top.count ? point : top), points[0]);
    const labelEvery = days === 30 ? 7 : days === 14 ? 4 : 1;
    const max = Math.max(4, ...points.map((point) => point.count));
    const step = W / Math.max(points.length - 1, 1);
    const x = (index: number) => index * step;
    const y = (count: number) => H - (count / max) * H * 0.9;

    // Curva suave (Catmull-Rom → Bézier) passando por todos os pontos.
    const coords = points.map((point, index) => [x(index), y(point.count)] as const);
    let line = `M${coords[0][0]},${coords[0][1]}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i - 1] ?? coords[i];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] ?? p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        line += ` C${c1[0]},${Math.min(H, c1[1])} ${c2[0]},${Math.min(H, c2[1])} ${p2[0]},${p2[1]}`;
    }
    const area = `${line} L${W},${H} L0,${H} Z`;

    const active = hover === null ? null : points[hover];
    const gridLines = [0.25, 0.5, 0.75];

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-medium text-admin-text">Atividade</h2>
                    <p className="text-xs text-admin-muted">Contatos registrados por dia</p>
                </div>
                <div
                    role="radiogroup"
                    aria-label="Período"
                    className="flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs"
                >
                    {periods.map((period) => (
                        <button
                            key={period}
                            type="button"
                            role="radio"
                            aria-checked={days === period}
                            onClick={() => {
                                setDays(period);
                                setHover(null);
                            }}
                            className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                                days === period
                                    ? "bg-dourado/90 font-medium text-grafite"
                                    : "text-admin-muted hover:text-admin-text"
                            }`}
                        >
                            {period} dias
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative h-44" onMouseLeave={() => setHover(null)}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 size-full overflow-visible"
                    role="img"
                    aria-label={`Contatos por dia nos últimos ${points.length} dias`}
                >
                    <defs>
                        <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d4b37a" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#b4915a" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {gridLines.map((ratio) => (
                        <line
                            key={ratio}
                            x1="0"
                            x2={W}
                            y1={H * ratio}
                            y2={H * ratio}
                            stroke="rgb(255 255 255 / 0.06)"
                            strokeDasharray="2 3"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    <line
                        x1="0"
                        x2={W}
                        y1={H}
                        y2={H}
                        stroke="rgb(255 255 255 / 0.1)"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path d={area} fill="url(#activity-fill)" />
                    <path
                        d={line}
                        fill="none"
                        stroke="#e0c088"
                        strokeWidth="2"
                        style={{ filter: "drop-shadow(0 0 4px rgb(212 179 122 / 0.45))" }}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    {hover !== null && (
                        <line
                            x1={x(hover)}
                            x2={x(hover)}
                            y1="0"
                            y2={H}
                            stroke="rgb(255 255 255 / 0.18)"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>

                {/* Faixas invisíveis, uma por dia: área de hover maior que o ponto. */}
                <div className="absolute inset-0 flex">
                    {points.map((point, index) => (
                        <div key={point.date} className="h-full flex-1" onMouseEnter={() => setHover(index)} />
                    ))}
                </div>

                {active && hover !== null && (
                    <>
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e0c088] shadow-[0_0_8px_rgb(212_179_122/0.6)] ring-2 ring-admin-ground"
                            style={{ left: `${x(hover)}%`, top: `${y(active.count)}%` }}
                        />
                        <div
                            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-admin-sidebar/70 backdrop-blur-xl px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl"
                            style={{ left: `${Math.min(Math.max(x(hover), 8), 92)}%` }}
                        >
                            <span className="text-admin-muted">{active.label}</span>{" "}
                            <span className="font-medium text-admin-text tabular-nums">
                                {active.count} {active.count === 1 ? "contato" : "contatos"}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="relative mt-2 h-4 text-[11px] text-admin-muted tabular-nums">
                {points.map((point, index) =>
                    (points.length - 1 - index) % labelEvery === 0 ? (
                        <span
                            key={point.date}
                            className={`absolute ${index === 0 ? "" : index === points.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                            style={{ left: `${x(index)}%` }}
                        >
                            {index === points.length - 1 ? "Hoje" : point.label}
                        </span>
                    ) : null,
                )}
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                <div>
                    <dt className="text-xs text-admin-muted">Total no período</dt>
                    <dd className="font-display text-lg font-semibold tabular-nums">{total}</dd>
                </div>
                <div>
                    <dt className="text-xs text-admin-muted">Média por dia</dt>
                    <dd className="font-display text-lg font-semibold tabular-nums">
                        {(total / days).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-admin-muted">Melhor dia</dt>
                    <dd className="font-display text-lg font-semibold tabular-nums">
                        {best && best.count > 0 ? `${best.label} · ${best.count}` : "—"}
                    </dd>
                </div>
            </dl>
        </div>
    );
}
