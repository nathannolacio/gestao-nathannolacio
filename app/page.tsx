import { redirect } from "next/navigation";

// A raiz não tem tela própria: é um sistema de gestão pessoal, então abre direto no sistema (área privada).
// Sem sessão, o proxy.ts leva para /login e volta para cá depois (?next=). Quando existir uma
// página inicial (dashboard), é só trocar o destino. Desde a Fase 1 (leads) o destino é o painel "Hoje".
export default function Home() {
  redirect("/hoje");
}
