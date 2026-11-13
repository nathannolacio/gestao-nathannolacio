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
    <div className="admin-shell flex min-h-dvh w-full min-w-0 flex-1 flex-col text-admin-text md:flex-row md:gap-3 md:p-3">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 shrink-0" />}>
          <SessionHeader />
        </Suspense>
        <main className="min-w-0 flex-1 px-4 pt-2 pb-8 sm:px-6 md:px-5">{children}</main>
      </div>
    </div>
  );
}
