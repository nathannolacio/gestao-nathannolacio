"use client";

import { useState, useTransition } from "react";
import { login } from "../actions";

const inputClass =
    "w-full rounded-lg border border-admin-line bg-admin-raised px-3 py-2.5 text-sm text-admin-text " +
    "placeholder:text-admin-muted/60 focus-visible:outline-2 focus-visible:outline-offset-0 " +
    "focus-visible:outline-dourado";

export function LoginForm({ next }: { next?: string }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
            // Em sucesso a action redireciona e nada volta; só o erro retorna.
            const result = await login({ email, password, next });
            if (result && !result.ok) setError(result.error);
        });
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5 text-sm text-admin-muted">
                E-mail
                <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-admin-muted">
                Senha
                <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                />
            </label>

            {error && (
                <p role="alert" className="text-sm text-red-400">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-dourado px-4 py-2.5 text-sm font-medium text-grafite transition-opacity disabled:opacity-60"
            >
                {pending ? "Entrando…" : "Entrar"}
            </button>
        </form>
    );
}
