// Quais dados do cliente ainda faltam para montar o contrato (calculado, nada salvo).
type ContractClient = {
    type: "PF" | "PJ";
    legalName: string | null;
    email: string | null;
    document: string | null;
    zipCode: string | null;
    street: string | null;
    addressNumber: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    legalRepName: string | null;
    legalRepDocument: string | null;
};

export function missingContractFields(client: ContractClient) {
    const missing: string[] = [];

    if (!client.legalName) missing.push(client.type === "PF" ? "nome completo" : "razão social");
    if (!client.document) missing.push(client.type === "PF" ? "CPF" : "CNPJ");
    if (!client.email) missing.push("e-mail");
    if (!client.zipCode || !client.street || !client.addressNumber || !client.neighborhood || !client.city || !client.state) {
        missing.push("endereço");
    }
    if (client.type === "PJ" && (!client.legalRepName || !client.legalRepDocument)) {
        missing.push("responsável legal");
    }

    return missing;
}
