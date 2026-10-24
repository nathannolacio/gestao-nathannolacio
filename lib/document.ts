// Validação de CPF e CNPJ pelos dígitos verificadores. Recebem só dígitos.

function allSame(digits: string) {
    return /^(\d)\1+$/.test(digits);
}

// Dígito verificador: soma dos dígitos × pesos, resto da divisão por 11.
function checkDigit(digits: string, weights: number[]) {
    const sum = weights.reduce((total, weight, i) => total + Number(digits[i]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(digits: string) {
    if (!/^\d{11}$/.test(digits) || allSame(digits)) return false;

    const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

    return first === Number(digits[9]) && second === Number(digits[10]);
}

export function isValidCnpj(digits: string) {
    if (!/^\d{14}$/.test(digits) || allSame(digits)) return false;

    const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return first === Number(digits[12]) && second === Number(digits[13]);
}

// Só para exibição: 12345678909 → 123.456.789-09; 12345678000195 → 12.345.678/0001-95.
export function formatDocument(digits: string | null) {
    if (!digits) return "";
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return digits;
}
