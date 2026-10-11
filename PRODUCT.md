# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Uma única pessoa: o próprio prestador de serviços de tecnologia (sites institucionais, landing pages e sistemas sob medida), que usa o sistema para gerir seu trabalho. A área administrativa é de uso individual, sempre em desktop ou notebook e ocasionalmente no celular. Terceiros acessam apenas a página pública da proposta, aberta pelo cliente via link, e ela não faz parte da área administrativa.

## Product Purpose

Sistema de gestão pessoal, com foco atual em propostas comerciais: criar a proposta a partir de um modelo, enviar o link ao cliente e ver quando ela é aprovada. Clientes, contratos e pagamentos vêm depois. Sucesso é conseguir criar, enviar e acompanhar propostas com poucos passos e sem perder o histórico.

## Positioning

Ferramenta sob medida para um único profissional, sem a carga de um CRM genérico: só o necessário para propor, enviar e acompanhar.

## Operating Context

- Fluxo: rascunho → enviada → aprovada. Depois de enviada, a proposta não é mais editada.
- Valores em dinheiro são guardados em centavos e totais são calculados na exibição.
- Textos fixos vêm de um modelo e são copiados para cada proposta ao criá-la.
- Aprovação aparece apenas no sistema, sem notificação por e-mail por enquanto.

## Capabilities and Constraints

- Stack: Next.js (App Router), React, TypeScript, Tailwind, Neon/PostgreSQL, Drizzle, Zod, Better Auth, Vercel.
- Leitura via Server Components; escrita via Server Actions.
- Login (Better Auth) ainda não existe (Etapa 8); o usuário logado não tem dado real por enquanto.
- Itens do menu da área admin definidos agora: Propostas, Clientes, Modelo de textos e Sair. Clientes e Modelo de textos ainda não têm tela.
- Header da área admin: apenas o usuário logado.
- Interface em português do Brasil.

## Brand Commitments

- Identidade do site institucional do prestador: cores grafite, marfim, cinza, dourado e bronze; fontes Inter e Space Grotesk (tokens em `app/globals.css`).
- A área administrativa é em modo dark. A página pública da proposta permanece clara (marfim).
- Preferência declarada para o admin: minimalista, profissional, com pegada de gestão/dashboard e sem aparência genérica de IA.

## Evidence on Hand

- Layout e componentes da página pública da proposta em `app/proposta/`.
- Dados reais ainda mínimos: um cliente e uma proposta de teste (seed de desenvolvimento).
- Sem logotipo próprio no sistema por enquanto.

## Product Principles

1. Uso individual: nenhuma complexidade de multiusuário ou permissões.
2. Poucos cliques para o que importa: criar, enviar e ver o status da proposta.
3. O histórico é preservado: proposta enviada não se edita; ajustes viram nova proposta.
4. Dado crítico (valores, aprovação) nunca é ambíguo na tela.

## Accessibility & Inclusion

Nenhum requisito específico além de contraste legível no modo dark e foco de teclado visível.
