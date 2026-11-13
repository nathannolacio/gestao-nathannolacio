import Link from "next/link";
import type { ReactNode } from "react";
import { journeySteps, stageGuide, stepIndex, type ChecklistItem } from "@/lib/journey";
import { leadStageLabel, type LeadStage } from "@/lib/leads";
import { ClaudeButton } from "./claude-button";

// Ação da etapa: abre o Claude com prompt, um link externo (WhatsApp, Maps) ou uma tela do sistema.
export type JourneyAction =
    | { kind: "claude"; label: string; prompt: string }
    | { kind: "external"; label: string; href: string }
    | { kind: "internal"; label: string; href: string; primary?: boolean };

// Barra de etapas + "o que fazer agora" da ficha do lead.
export function JourneyPanel({
    stage,
    checklist,
    actions,
}: {
    stage: LeadStage;
    checklist: ChecklistItem[];
    actions: JourneyAction[];
}) {
    const current = stepIndex(stage);
    const guide = stageGuide[stage];

    return (
        <section aria-label="Jornada do lead" className="rounded-xl border border-admin-line bg-admin-raised/30">
            <JourneyBar current={current} lost={stage === "lost"} />

            <div className="grid gap-6 border-t border-admin-line p-4 sm:p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div>
                    <p className="text-xs font-medium tracking-wide text-admin-muted uppercase">
                        Agora · {leadStageLabel[stage]}
                    </p>
                    <p className="mt-1 text-sm text-admin-text">{guide.goal}</p>
                    {guide.exit && <p className="mt-1 text-xs text-admin-muted">Avança quando: {guide.exit}</p>}

                    {checklist.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {checklist.map((item) => (
                                <ChecklistRow key={item.label} item={item} />
                            ))}
                        </ul>
                    )}
                </div>

                {actions.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-medium tracking-wide text-admin-muted uppercase">Ações da etapa</p>
                        {actions.map((action) => (
                            <ActionItem key={action.label} action={action} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// Barra horizontal com as etapas: feitas (✓), atual (destaque) e próximas. Rola no celular.
export function JourneyBar({ current, lost = false }: { current: number; lost?: boolean }) {
    return (
        <ol className="flex overflow-x-auto px-2 py-3 sm:px-3">
            {journeySteps.map((step, index) => {
                const done = !lost && index < current;
                const active = !lost && index === current;
                return (
                    <li key={step.id} className="flex shrink-0 items-center">
                        <span
                            aria-current={active ? "step" : undefined}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs whitespace-nowrap ${
                                active
                                    ? "bg-dourado/15 font-medium text-dourado"
                                    : done
                                      ? "text-admin-text"
                                      : "text-admin-muted/70"
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${
                                    active
                                        ? "border-dourado bg-dourado text-grafite"
                                        : done
                                          ? "border-admin-success/60 text-admin-success"
                                          : "border-admin-line"
                                }`}
                            >
                                {done ? "✓" : index + 1}
                            </span>
                            {step.label}
                        </span>
                        {index < journeySteps.length - 1 && (
                            <span aria-hidden="true" className="mx-1 h-px w-4 bg-admin-line sm:w-6" />
                        )}
                    </li>
                );
            })}
            {lost && <li className="ml-3 shrink-0 self-center text-xs text-red-300">Perdido</li>}
        </ol>
    );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
    const icon: ReactNode =
        item.done === null ? (
            <span className="text-admin-muted">○</span>
        ) : item.done ? (
            <span className="text-admin-success">✓</span>
        ) : (
            <span className="text-dourado">•</span>
        );

    return (
        <li className="flex gap-2 text-sm">
            <span aria-hidden="true" className="w-4 shrink-0 text-center">
                {icon}
            </span>
            <span>
                <span className={item.done ? "text-admin-muted line-through decoration-admin-muted/50" : "text-admin-text"}>
                    {item.label}
                </span>
                <span className="sr-only">
                    {item.done === null ? " (fora do sistema)" : item.done ? " (feito)" : " (pendente)"}
                </span>
                {item.hint && !item.done && <span className="block text-xs text-admin-muted">{item.hint}</span>}
            </span>
        </li>
    );
}

function ActionItem({ action }: { action: JourneyAction }) {
    if (action.kind === "claude") return <ClaudeButton label={action.label} prompt={action.prompt} />;

    if (action.kind === "external") {
        return (
            <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
            >
                {action.label}
                <span aria-hidden="true" className="text-admin-muted">↗</span>
            </a>
        );
    }

    return (
        <Link
            href={action.href}
            className={
                action.primary
                    ? "flex w-fit rounded-lg bg-dourado px-3 py-2 text-sm font-medium text-grafite transition-opacity duration-150 hover:opacity-90"
                    : "flex w-fit rounded-lg border border-admin-line px-3 py-2 text-sm text-admin-text transition-colors duration-150 hover:border-dourado"
            }
        >
            {action.label}
        </Link>
    );
}
