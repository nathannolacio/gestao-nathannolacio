import type { ReactNode } from "react";
import { Header } from "./_components/header";
import { Sidebar } from "./_components/sidebar";

// Provisório: na Etapa 8 estes dados vêm da sessão do Better Auth.
const user = { name: "Nathan Nolácio", email: "nathannolacio04@gmail.com" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell flex min-h-screen flex-1 flex-col bg-admin-ground text-admin-text md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header userName={user.name} userEmail={user.email} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
