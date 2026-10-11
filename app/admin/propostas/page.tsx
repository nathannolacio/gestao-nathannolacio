import { db } from "@/db";
import { Suspense } from "react";

export default function Propostas() {

    return (
        <>
            <h1>Propostas</h1>

            <Suspense fallback={<p>Carregando...</p>}>
                <ListaPropostas />
            </Suspense>            
        </>   
    );
}
async function ListaPropostas() {
    const propostas = await db.query.proposals.findMany({
        where: {
            deletedAt: {
                isNull: true
            }
        },
        with: {
            client: true
        }
    })

    return (
        <ul>
            {propostas.map((proposta) => (
                <li key={proposta.id}>
                    <h2>{proposta.title}</h2>

                    <p>
                        {`Id: ${proposta.id} - Cliente: ${proposta.client?.name}`}
                    </p>
                </li>
            ))}
        </ul>
    );
}