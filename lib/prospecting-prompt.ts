// Prompt base para pedir a uma IA a lista de prospecção já no formato da importação (/leads/importar).
// As regras de formato aqui precisam bater com lib/lead-import.ts e com o leadSchema (lib/schemas/lead.ts):
// se mudar coluna, separador ou limite lá, mude aqui também.

import { importColumns, MAX_IMPORT_ROWS } from "./lead-import.ts";

export type ProspectingPromptInput = {
    niche: string;
    cities: string;
    count: number;
};

export const defaultPromptInput: ProspectingPromptInput = {
    niche: "",
    cities: "Caieiras e Franco da Rocha",
    count: 20,
};

export function buildProspectingPrompt({ niche, cities, count }: ProspectingPromptInput) {
    const nicho = niche.trim() || "[NICHO, ex.: doceria, dentista, esteticista]";
    const cidades = cities.trim() || "[CIDADES]";
    const quantidade = Math.min(Math.max(Math.trunc(count) || 20, 1), MAX_IMPORT_ROWS);
    const header = importColumns.join(";");

    return `Você é meu assistente de prospecção. Eu sou o Nathan, de Caieiras (SP), e faço sites one-page e cardápios digitais para pequenos negócios da região. Vou abordar cada negócio pelo WhatsApp com uma prévia do site deles.

## Tarefa
Encontre ${quantidade} negócios de ${nicho} em ${cidades} que sejam bons candidatos a um site. Pesquise no Google Maps e no Instagram e use só informação pública do negócio (ficha do Google e perfil comercial).

## Quem entra
- Negócio aberto e ativo: postou no Instagram nos últimos 2 meses ou tem avaliação recente no Google.
- NÃO tem site próprio funcionando. Pode ter só Instagram, Linktree, página do iFood ou site quebrado/abandonado.
- Tem um jeito de falar direto: WhatsApp (celular) na ficha, na bio ou no link do Instagram.
- Fica de fora: franquia ou rede, negócio que parece fechado, Instagram parado há mais de 2 meses, quem já tem site próprio funcionando.

## Nota (coluna "nota")
- A: celular/WhatsApp que parece ser do dono, postou nos últimos 15 dias e tem 30 avaliações ou mais no Google (ou 1.000 seguidores ou mais no Instagram).
- B: tem celular, mas pouca avaliação ou pouca postagem, ou é um negócio com equipe/recepção.
- C: só telefone fixo, passa por recepção, ou já usa iFood/site de pedidos e parece satisfeito.
Ordene a lista com os A primeiro, depois B, depois C.

## Gancho (coluna "gancho")
Uma frase curta (até 250 caracteres) que vou colar na primeira mensagem, baseada em um fato REAL e verificável do negócio. Exemplos: "Com 110 avaliações e nota 4,9 no Google, falta só o site para quem pesquisa dentista em Caieiras achar vocês." ou "Os bolos de vocês no Instagram já vendem sozinhos; um cardápio com preço e pedido no WhatsApp facilita para quem chega pela bio."
Não invente números, prêmios nem elogios genéricos. Sem ponto e vírgula.

## Formato da resposta (MUITO IMPORTANTE: vou colar direto no meu sistema)
Responda com UM bloco de código contendo só a lista, sem nada antes dentro do bloco:
- 1ª linha: exatamente este cabeçalho:
${header}
- Uma linha por negócio, com as 10 colunas na ordem do cabeçalho, separadas por ponto e vírgula (;).
- Coluna vazia continua com o separador (ex.: "...;;..."). Toda linha tem exatamente 9 ponto e vírgulas.
- Nunca use ponto e vírgula dentro de um campo (troque por vírgula). Sem aspas, sem markdown, sem linhas em branco.

Regras de cada coluna:
- negocio: nome do negócio como aparece no Google/Instagram (2 a 100 caracteres). Obrigatório.
- contato: primeiro nome do dono ou responsável, só se aparecer publicamente. Senão, vazio.
- segmento: o tipo de negócio em poucas palavras (até 60 caracteres), ex.: Doceria, Dentista, Estética.
- cidade: a cidade do negócio.
- whatsapp: só dígitos, com 55 + DDD + número (12 ou 13 dígitos), ex.: 5511912345678. Se não tiver certeza, deixe vazio. NUNCA invente ou complete número.
- instagram: só o usuário, sem @ (ex.: docesdamaria). Vazio se não tiver.
- nota: A, B ou C.
- previa_url: deixe SEMPRE vazio (eu preencho depois de fazer a prévia).
- maps_url: link da ficha no Google Maps começando com https://. Vazio se não achar.
- gancho: a frase descrita acima.

Cada linha precisa ter whatsapp OU instagram preenchido. Não repita negócio.

## Depois do bloco
Fora do bloco de código, em no máximo 5 linhas: quantos de cada nota você encontrou e quais negócios descartou e por quê (ex.: "já tem site", "parece fechado").`;
}
