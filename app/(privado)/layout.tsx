import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getOptionalUser } from "@/lib/auth";
import { Header } from "./_components/header";
import { Sidebar } from "./_components/sidebar";

// Lê a sessão (dado de requisição, dinâmico), por isso fica dentro de <Suspense>.
// Além de mostrar o usuário, é a validação REAL da sessão: o proxy só confere se
// o cookie existe; aqui um cookie forjado ou expirado manda para o login.
async function SessionHeader() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  return <Header userName={user.name} userEmail={user.email} />;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell flex min-h-dvh flex-1 flex-col bg-admin-ground text-admin-text md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-14 shrink-0 border-b border-admin-line" />}>
          <SessionHeader />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
