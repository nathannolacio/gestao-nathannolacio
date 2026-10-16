import { Suspense } from "react";
import { LoginForm } from "./_components/login-form";

export const metadata = { title: "Entrar" };

// searchParams é dado de requisição (dinâmico): com Cache Components precisa
// ser lido dentro de <Suspense>, como as leituras de banco.
async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next } = await searchParams;
    return <LoginForm next={next} />;
}

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    return (
        <div className="admin-shell flex min-h-screen flex-1 items-center justify-center bg-admin-ground p-6 text-admin-text">
            <main className="w-full max-w-sm">
                <h1 className="mb-1 font-display text-2xl font-medium tracking-tight">Gestão</h1>
                <p className="mb-8 text-sm text-admin-muted">Acesso restrito.</p>
                <Suspense fallback={null}>
                    <Form searchParams={searchParams} />
                </Suspense>
            </main>
        </div>
    );
}
