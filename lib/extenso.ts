// Números por extenso em português (para valores e prazos do contrato). Só inteiros de 0 a 999.999.999.

const UNITS = [
    "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
    "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = [
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos",
];

// 1 a 999.
function belowThousand(n: number): string {
    if (n === 100) return "cem";
    const parts: string[] = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds > 0) parts.push(HUNDREDS[hundreds]);
    if (rest > 0) {
        if (rest < 20) parts.push(UNITS[rest]);
        else {
            const unit = rest % 10;
            parts.push(unit === 0 ? TENS[Math.floor(rest / 10)] : `${TENS[Math.floor(rest / 10)]} e ${UNITS[unit]}`);
        }
    }
    return parts.join(" e ");
}

// Regra do "e" entre grupos: entra quando o último grupo é menor que 100 ou é centena redonda
// ("mil e duzentos", "mil e cinco", mas "mil duzentos e cinquenta").
function joinGroups(groups: { text: string; value: number }[]): string {
    return groups
        .map((group, index) => {
            if (index === 0) return group.text;
            const last = index === groups.length - 1;
            const needsE = last && (group.value < 100 || group.value % 100 === 0);
            return `${needsE ? " e " : " "}${group.text}`;
        })
        .join("");
}

export function numeroPorExtenso(n: number): string {
    if (!Number.isInteger(n) || n < 0 || n > 999_999_999) throw new Error("Número fora do intervalo suportado.");
    if (n === 0) return UNITS[0];

    const millions = Math.floor(n / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;

    const groups: { text: string; value: number }[] = [];
    if (millions > 0) groups.push({ text: `${belowThousand(millions)} ${millions === 1 ? "milhão" : "milhões"}`, value: millions });
    if (thousands > 0) groups.push({ text: thousands === 1 ? "mil" : `${belowThousand(thousands)} mil`, value: thousands });
    if (rest > 0) groups.push({ text: belowThousand(rest), value: rest });

    return joinGroups(groups);
}

// 49700 → "quatrocentos e noventa e sete reais"; 6950 → "sessenta e nove reais e cinquenta centavos".
export function reaisPorExtenso(cents: number): string {
    if (!Number.isInteger(cents) || cents < 0) throw new Error("Valor inválido.");

    const reais = Math.floor(cents / 100);
    const rest = cents % 100;
    const parts: string[] = [];

    if (reais > 0) {
        // "um milhão de reais", "dois milhões de reais" (só quando o valor é milhão redondo).
        const de = reais >= 1_000_000 && reais % 1_000_000 === 0 ? " de" : "";
        parts.push(`${numeroPorExtenso(reais)}${de} ${reais === 1 ? "real" : "reais"}`);
    }
    if (rest > 0) parts.push(`${numeroPorExtenso(rest)} ${rest === 1 ? "centavo" : "centavos"}`);
    if (parts.length === 0) return "zero reais";

    return parts.join(" e ");
}
