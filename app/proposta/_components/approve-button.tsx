"use client";

// Por enquanto só visual. Na etapa 7 isto chama a Server Action pública
// de aprovar (buscando a proposta pelo token).
export function ApproveButton() {
  return (
    <button
      type="button"
      className="rounded-full bg-dourado px-10 py-4 text-lg font-semibold text-grafite transition hover:bg-marfim active:scale-95"
    >
      Aprovar proposta
    </button>
  );
}
