// Importação de leads em lote: transforma o texto colado (planilha ou CSV) em linhas cruas.
// Só separa colunas; a validação de cada linha é do Zod (leadSchema) dentro da action.

// Colunas aceitas, na ordem usada quando o texto NÃO tem cabeçalho.
export const importColumns = [
    "negocio",
    "contato",
    "segmento",
    "cidade",
    "whatsapp",
    "instagram",
    "nota",
    "previa_url",
    "maps_url",
    "gancho",
] as const;
export type ImportColumn = (typeof importColumns)[number];

export const MAX_IMPORT_ROWS = 200;

// Outros nomes aceitos no cabeçalho (comparados sem acento, minúsculos e sem espaços/hífens).
const aliases: Record<string, ImportColumn> = {
    negocio: "negocio",
    nome: "negocio",
    empresa: "negocio",
    contato: "contato",
    dono: "contato",
    segmento: "segmento",
    nicho: "segmento",
    cidade: "cidade",
    whatsapp: "whatsapp",
    telefone: "whatsapp",
    celular: "whatsapp",
    instagram: "instagram",
    nota: "nota",
    prioridade: "nota",
    previaurl: "previa_url",
    previa: "previa_url",
    mapsurl: "maps_url",
    maps: "maps_url",
    googlemaps: "maps_url",
    gancho: "gancho",
};

function normalizeHeader(cell: string) {
    return cell
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[\s_-]/g, "");
}

function splitLine(line: string, separator: string) {
    // Tira aspas das pontas (CSV simples); campos com o separador dentro não são suportados.
    return line.split(separator).map((cell) => cell.trim().replace(/^"(.*)"$/, "$1").trim());
}

export type ParsedImport = {
    rows: { line: number; values: Partial<Record<ImportColumn, string>> }[];
    hasHeader: boolean;
    // Nomes do cabeçalho que não correspondem a nenhuma coluna (avisados na tela, ignorados).
    unknownHeaders: string[];
    tooMany: boolean;
};

export function parseLeadImport(text: string): ParsedImport {
    const lines = text
        .split(/\r?\n/)
        .map((line, index) => ({ line: index + 1, raw: line }))
        // Ignora linhas vazias e as cercas de bloco de código (```) que vêm junto ao copiar a resposta de uma IA.
        .filter(({ raw }) => raw.trim() !== "" && !raw.trim().startsWith("```"));

    if (lines.length === 0) return { rows: [], hasHeader: false, unknownHeaders: [], tooMany: false };

    // Planilha colada vem separada por tab; CSV exportado no Brasil costuma usar ";".
    const separator = text.includes("\t") ? "\t" : ";";

    const firstCells = splitLine(lines[0].raw, separator);
    const hasHeader = firstCells.some((cell) => aliases[normalizeHeader(cell)] === "negocio");

    let columns: (ImportColumn | null)[] = [...importColumns];
    const unknownHeaders: string[] = [];
    if (hasHeader) {
        columns = firstCells.map((cell) => {
            const column = aliases[normalizeHeader(cell)] ?? null;
            if (!column && cell !== "") unknownHeaders.push(cell);
            return column;
        });
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows = dataLines.slice(0, MAX_IMPORT_ROWS).map(({ line, raw }) => {
        const values: Partial<Record<ImportColumn, string>> = {};
        splitLine(raw, separator).forEach((cell, index) => {
            const column = columns[index];
            if (column && cell !== "") values[column] = cell;
        });
        return { line, values };
    });

    return { rows, hasHeader, unknownHeaders, tooMany: dataLines.length > MAX_IMPORT_ROWS };
}
