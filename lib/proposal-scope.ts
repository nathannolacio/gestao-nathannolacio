// Escopo de um item da proposta (opcional). Aparece ao abrir a setinha do item, em "O projeto".
// Fica em proposal_items.scope (jsonb): item sem escopo não tem setinha.
// O título do escopo é a própria descrição do item.
// Um site tem 1 ou mais PÁGINAS e cada página tem suas SEÇÕES. Página única: 1 página sem nome.
export type ScopePage = {
  name: string; // vazio na página única; obrigatório quando há mais de uma
  sections: string[]; // seções dessa página
};

// Textos fixos do escopo, iguais para todo item com escopo (não são digitados nem guardados).
export const SCOPE_DESCRIPTION = "Site institucional sob medida, responsivo para celular.";
export const SCOPE_OUT_OF_SCOPE_NOTE = "Qualquer item fora deste escopo é orçado à parte.";

export type ItemScope = {
  pages: ScopePage[];
  included: string[]; // pílulas de "Incluso no site" (texto livre, adicionadas no formulário)
  notIncluded: string[]; // pílulas de "Não incluso" (texto livre, adicionadas no formulário)
};

// Totais calculados na exibição (nada guardado a mais): os rótulos "N páginas" e "N seções".
export function scopeCounts(scope: ItemScope) {
  return {
    pages: scope.pages.length,
    sections: scope.pages.reduce((sum, page) => sum + page.sections.length, 0),
  };
}

export function pagesLabel(count: number) {
  return count === 1 ? "Página única" : `${count} páginas`;
}

export function sectionsLabel(count: number) {
  return `${count} ${count === 1 ? "seção" : "seções"}`;
}
