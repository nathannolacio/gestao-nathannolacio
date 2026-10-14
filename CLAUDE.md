# Sobre este projeto
Sistema de gestão pessoal para minha atuação como prestador de serviços
de tecnologia (sites institucionais, landing pages e sistemas sob medida).
Uso individual: apenas eu acesso o sistema. A única parte acessada por
terceiros é a página pública da proposta, aberta pelo cliente via link.

# Seu papel: mentor, não executor
Eu quero escrever o código deste projeto. Você é meu par de programação e mentor.

## Regras
- NÃO escreva nem edite arquivos do projeto, a menos que eu peça explicitamente
  ("pode fazer", "escreve pra mim").
- Explique conceitos e sugira a abordagem; eu implemento.
- Exemplos de código só em trechos curtos e ilustrativos, não a solução completa.
- Ao revisar meu código: aponte bugs, problemas de segurança e más práticas,
  explicando o porquê. Deixe eu fazer a correção.
- Em erros, me ajude a investigar (o que ler, onde olhar) antes de dar a resposta.
- Em decisões de arquitetura, apresente opções com prós e contras e deixe eu decidir.
- Divida tarefas grandes em passos pequenos.
- Indique a documentação oficial quando for útil, para eu treinar a leitura.
- Responda em português.

## Como conduzir a conversa
- Uma informação/passo por vez. Muita informação de uma vez me perde.
- Em cada passo, diga: em que etapa estamos, o que vamos fazer e PARA QUÊ.
- Respostas curtas.

## Exceções
- Configurações repetitivas/boilerplate: pode sugerir fazer, mas pergunte antes.
- Front-end visual (páginas, estilos, animações, componentes de UI): posso pedir
  para você escrever, a partir de prints de referência. Isso vale para UI; schema,
  Server Actions, validação, auth e banco continuam no modo mentor.

# Meu nível
- Base sólida em Java (OO, tipagem, lógica, controllers, Spring Security).
- Já fiz projetos Next + banco + login (JWT), mas sempre com a IA escrevendo.
- Objetivo agora: escrever eu mesmo. Explique conceitos de Next/React/Drizzle
  quando surgirem, fazendo paralelos com Java quando ajudar.

# Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Banco: Neon (PostgreSQL)
- ORM: Drizzle
- Validação: Zod
- Auth: Better Auth (email e senha, sessões salvas no banco via adaptador Drizzle)
- Escrita de dados via Server Actions; leitura via Server Components
- Hospedagem: Vercel
- Identidade visual: cores do meu site institucional, aplicadas no sistema e na proposta
  (tokens em `app/globals.css`: grafite, marfim, cinza, dourado, bronze; fontes Inter e
  Space Grotesk). Preferência: visual leve e calmo, sem blocos pretos pesados.
- Modo dark: a ÁREA ADMINISTRATIVA (`app/admin/`) é em modo dark, com visual minimalista,
  profissional e pegada de gestão/dashboard. A página pública da proposta continua clara
  (marfim). Rotas do admin ficam sob `/admin` (decisão da Etapa 3; facilita o middleware da Etapa 8)
  e compartilham um `app/admin/layout.tsx` (menu lateral + header).

# Regras do projeto
- Valores em dinheiro SEMPRE como inteiro em centavos (R$ 1.500,00 = 150000).
  Nunca usar float. Formatar para reais apenas na exibição.
- Não salvar no banco valores que podem ser calculados (subtotais, total,
  valor com desconto do Pix). Calcular na hora a partir dos dados salvos.
- Toda Server Action é um endpoint acessível pela rede. Em TODA action:
  1. Verificar se o usuário está autenticado.
  2. Validar os dados recebidos com Zod antes de usar.
  Se eu esquecer qualquer um dos dois, me avise.
- EXCEÇÃO: a action de aprovar proposta é pública (o cliente não tem login).
  A proteção dela é o token público. Ela deve:
  1. Buscar a proposta pelo token (nunca pelo ID).
  2. Só aprovar se o status for "enviada".
  3. Receber a forma de pagamento escolhida e validá-la com Zod: `paymentMethod` ∈
     `pix | split | card`; `cardInstallments` (inteiro de 1 a 10) obrigatório se `card`
     e proibido nos outros métodos.
  4. Gravar `paymentMethod`, `cardInstallments` (se houver) e `approvedAt` no mesmo `update`.
- Middleware pode proteger páginas, mas não substitui a verificação dentro da action.
- Nunca confiar em dados vindos do navegador.
- Nunca expor o ID do banco em URLs públicas.

# MVP: Propostas comerciais
Foco atual. Gestão completa de clientes, contratos, pagamentos e gateway ficam para depois.

## Como a proposta funciona
- Eu crio a proposta no sistema a partir de um modelo com textos padrão.
- O cliente recebe um link e vê a proposta como uma página web.
- Na página há um botão "Aprovar proposta". Não há botão de recusar.
- O cliente ESCOLHE a forma de pagamento na própria página, junto com a aprovação (um
  único passo): o botão "Aprovar proposta" só é liberado depois da escolha. Se escolher
  cartão, escolhe também o número de parcelas (1 a 10).
- Depois de enviada, a proposta NÃO pode mais ser editada.
- Ajustes ou serviços futuros (ex.: manutenção) viram uma proposta nova.
- Sem numeração própria, sem validade e sem expiração por enquanto.
- Aprovação: apenas aparece no sistema (sem notificação por email por enquanto).

## Seções da proposta (na ordem da página)
Fixas = vêm do modelo, iguais para todos. Variáveis = preenchidas por proposta.
0. Capa (título da proposta + card flutuante com o nome/logo do cliente; variável)
1. Quem sou eu (fixa)
2. Vantagens de trabalhar comigo (fixa)
3. Etapa por etapa / processo de desenvolvimento (fixa), com o card de prazo de entrega
   (prazo variável) e o texto de manutenção (fixo) junto da última etapa
4. Portfólio / projetos (fixa, 2 projetos por enquanto)
5. Investimento (um card único): serviços solicitados, itens, descontos, total,
   hospedagem (variáveis), bônus (catálogo fixo; escolho quais valem em cada proposta; cada
   card mostra o valor agregado RISCADO com o selo "Grátis") e formas de pagamento
   (fixas; valores do Pix e das parcelas calculados na exibição; o cliente escolhe uma)
6. FAQ / perguntas frequentes (fixa)
7. Fechamento com o botão "Aprovar proposta"

Removidas do plano original: "Sobre o seu projeto" (o que será entregue vai nos serviços
do Investimento), "Contrato" e "Prazo e entrega" como seção própria (fundida no processo).
O layout da página já existe com dados mock (ver "Estado atual").

## Textos padrão e "foto" da proposta
- Os textos fixos ficam numa tabela de modelo (proposal_template), com um único
  registro por enquanto. Inicialmente preenchido via script/seed; tela de edição
  do modelo fica para depois.
- Ao CRIAR uma proposta, os textos fixos são COPIADOS para a proposta
  (coluna fixed_content, jsonb). Assim, editar o modelo no futuro não altera
  propostas já enviadas ou aprovadas.

## Regras de valores
- Cada item: quantidade × valor unitário, com desconto opcional no item.
- A proposta pode ter um desconto opcional no total.
- Descontos podem ser percentuais ou valor fixo.
  - Percentual: guardar como inteiro (10 = 10%).
  - Fixo: guardar em centavos.
- Ordem do cálculo:
  1. Subtotal do item = quantidade × valor unitário − desconto do item
  2. Subtotal do projeto = soma dos subtotais dos itens
  3. Total do projeto = subtotal do projeto − desconto geral
  4. Valor à vista no Pix = total do projeto × 0,9 (10% de desconto, calculado na exibição)
- Arredondamento sempre para centavos inteiros.
- Hospedagem: valor ANUAL opcional (só quando o cliente não tem hospedagem própria),
  separado do total do projeto, sem desconto e fora do cálculo do Pix.
- Domínio: contratado pelo cliente, não aparece na proposta.
- Manutenção: 60 dias grátis após a entrega. Agora é um BÔNUS do catálogo ("60 dias de
  hospedagem e manutenção", inclui a hospedagem); depois disso é avulsa.
- Bônus (decisão): catálogo FIXO em `lib/proposal-bonuses.ts` (Google Meu Negócio, Painel de
  métricas, 60 dias de hospedagem e manutenção), pensado para site institucional. Em cada proposta
  só escolho quais valem (o motivo de tirar um: o cliente já tem ou não quer). O navegador manda só
  os IDS; o servidor copia título, descrição e valor do catálogo para `proposals.bonuses` (a "foto").
  O `value` (centavos) é só referência exibida riscada; bônus não é cobrado e nunca entra no total.
  Id de bônus repetido é BARRADO (refine), não corrigido.

## Formas de pagamento (escolhidas pelo cliente ao aprovar)
- `pix`: 100% à vista no Pix, com 10% de desconto
- `split`: 50% na entrada + 50% na entrega
- `card`: cartão de crédito em até 10x sem juros (parcela = total ÷ n, arredondada em
  centavos, calculada na exibição)
- Gateway: Asaas.

## Modelo de dados
- clients: id, tipo (PF | PJ, enum `client_type`), nome, email, telefone,
  criado em, deleted_at (soft delete)
  (mínimo, só para vincular à proposta; sem CPF/CNPJ por enquanto)
- proposal_template: id, textos das seções fixas, atualizado em
  (as seções fixas são: about, advantages, portfolio, process, payment, delivery e faq;
  tipo `FixedContent` em `lib/proposal-content.ts`)
- proposals: id, public_token (aleatório, único), client_id, título,
  bonuses (jsonb, array de `ProposalBonus` {id, title, description, value em centavos};
  notNull, default `[]`), delivery_days (prazo),
  discount_type (percentage | fixed | nulo, enum `discount_type`), discount_value,
  hosting_annual (centavos, opcional), fixed_content (jsonb, cópia do modelo),
  status (enum `proposal_status`: draft | sent | approved), sent_at, approved_at,
  payment_method (enum `payment_method`: pix | split | card; nulo até a aprovação),
  card_installments (smallint, 1 a 10; nulo se o método não for `card`),
  criado em, atualizado em, deleted_at (soft delete)
  (`about_project` NÃO foi criada: a seção deixou de existir; adicionar depois se mudar de ideia)
- proposal_items: id, proposal_id, descrição, quantidade,
  unit_price (centavos), discount_type, discount_value, posição (ordem de exibição)
- Tabelas de usuário e sessão: geradas pelo Better Auth.

## Status da proposta
rascunho → enviada → aprovada
(Schema preparado para receber novos status no futuro, ex.: arquivada/recusada.)

## Decisões pendentes
- Status para propostas não aprovadas: "arquivada", "recusada" ou nenhum.
- Incluir ou não CPF/CNPJ do cliente na proposta.
- Tela para editar os textos do modelo.
- Portfólio: fixo no modelo ou escolher projetos por proposta.
- Notificação (email) quando a proposta for aprovada.
- `about_project`: remover da tabela e do formulário (a seção deixou de existir)?
- Detalhe de cada serviço (ex.: "Design + Implementação"): criar campo em `proposal_items`?
  Hoje a página mostra só descrição e quantidade.
- Logo do cliente no card da capa: coluna `logo_url` em `clients` (arquivo hospedado,
  ex.: Vercel Blob) ou só iniciais/nome? Hoje é um placeholder com as iniciais.
- Texto do botão final da página ("formalizarmos o contrato"): ajustar, já que não há
  mais seção de contrato.
- Copy dos textos fixos (`lib/proposal-content.ts`): três trechos afirmam "60 dias de manutenção
  gratuita" para TODOS (item "Suporte depois da entrega" das vantagens, `delivery.maintenance` e
  resposta do FAQ), mas agora isso é um bônus opcional. Ajustar, e revisar o FAQ/linha de
  hospedagem para deixar claro que o valor anual vale DEPOIS dos 60 dias de hospedagem grátis.

## Etapas
1. Setup: criar projeto Next, conectar ao Neon, configurar Drizzle. (CONCLUÍDA)
2. Schema: escrever as tabelas no Drizzle, rodar a primeira migration
   e criar o seed do modelo de textos.
3. Listagem: página que lista propostas lendo do banco (Server Components). (CONCLUÍDA)
4. Criar proposta: formulário + Server Action + validação com Zod
   (cliente novo ou existente, título, bônus, prazo, hospedagem, desconto). (CONCLUÍDA)
5. Itens e valores: adicionar/remover itens, descontos e cálculo dos totais
   (Client Components, estado).
6. Página pública: rota com token mostrando a proposta completa com a identidade visual.
   (Layout pronto com dados mock; falta buscar a proposta no banco pelo token.)
7. Enviar e aprovar: travar a proposta ao enviar, gerar o link,
   botão de aprovar na página pública.
8. Login: Better Auth protegendo todo o sistema, exceto a página pública
   e a action de aprovar.
9. Deploy na Vercel.

# Estado atual
- Etapa atual: 5 (Itens e valores). Etapas 1, 2 (Schema), 3 (Listagem) e 4 (Criar proposta) concluídas.
- Pronto na Etapa 4 (branch `feat/criar-proposta`):
  - `lib/auth.ts`: `requireUser()` PROVISÓRIA (async, devolve `{ id: "dev-user", name, email }` fixos),
    com `TODO` da Etapa 8 (trocar pela sessão do Better Auth e lançar erro sem usuário; não deployar assim).
  - `app/admin/propostas/actions.ts`: `createProposal(input: unknown)`. Fluxo: `requireUser()` →
    `proposalSchema.safeParse` → foto dos bônus (`bonusCatalog.filter` pelos ids validados) →
    `public_token` (`randomBytes(18).toString("base64url")` = 24 caracteres) → `db.transaction`
    (cliente existente: confere existência e `deletedAt` nulo; novo: insere com `.returning`;
    copia `proposal_template.content` para `fixedContent`; insere a proposta). Retorno: `{ ok: true }`
    ou `{ ok: false, fieldErrors, formError }` (`as const`). `ClientNotFoundError` aborta a transação e
    vira `formError` fora dela; "template não encontrado" continua sendo `throw` (erro de configuração).
    Testada manualmente (cliente novo, dados inválidos, cliente inexistente com rollback).
  - `app/admin/propostas/nova/page.tsx`: casca + `<Suspense>`; `FormularioComClientes` (async,
    `connection()`) lê `id` e `name` dos clientes ativos e passa por prop ao formulário.
  - `app/admin/propostas/nova/_components/proposal-form.tsx`: Client Component (estado + `onSubmit`
    chamando a action com objeto, opção A). Envia só TEXTO; a conversão para centavos é do Zod.
    Em sucesso, `router.push("/admin/propostas")`. Erros do cliente aparecem em lista única (o
    `z.flattenError` só agrupa pela chave de topo `client`); para erro por campo, usar `z.treeifyError`.
  - Botão "Nova proposta" na listagem (`app/admin/propostas/page.tsx`).
  - Itens, valores e total NÃO existem ainda: propostas criadas saem sem itens (Etapa 5).
- Base da Etapa 4 (validação e catálogo):
  - `lib/proposal-bonuses.ts`: `bonusCatalog` (ids `google-meu-negocio`, `painel-metricas`,
    `manutencao-60-dias`; o último ainda tem esse id mesmo com o título "60 dias de hospedagem e
    manutenção": renomear ANTES de salvar propostas reais), `value` em centavos (15000, 20000, 6000),
    tipos `BonusId` e `ProposalBonus` e a tupla `bonusIds` para `z.enum`.
  - `db/schema.ts`: `proposals.bonus` (text) trocado por `bonuses` (jsonb, notNull, default `[]`).
    Migration `drizzle/20261013182456_misty_black_widow` aplicada no Neon (o texto de teste do
    `seed-dev` foi perdido, sem problema). Comandos: `npx drizzle-kit generate` e `migrate`
    (não há scripts no package.json). Ao gerar, escolher "create column" (não rename) quando
    o tipo da coluna muda.
  - `lib/money.ts`: `parseReaisToCents(texto)` converte "1.500,00" / "R$ 19,99" em centavos sem
    float; devolve `null` se inválido ou acima do limite do integer.
  - `lib/schemas/client.ts`: `clientSchema` = `z.discriminatedUnion("clientMode", [new, existing])`.
    `new`: nome (3 a 100), e-mail (até 256), telefone (limpa símbolos e exige 13 dígitos), tipo PF/PJ.
    `existing`: `clientId` UUID.
  - `lib/schemas/proposal.ts`: `proposalSchema` e `ProposalInput`. `client` aninhado; `title` (5 a 100,
    trim); `deliveryDays` (inteiro > 0); `bonuses` (ids do catálogo, sem repetição, default `[]`);
    `hostingAnnual` e `discountValue` recebem TEXTO em reais ("600,00") e entregam CENTAVOS (a
    conversão é feita no schema, não no formulário); `discountType` + `discountValue` vêm juntos ou
    nenhum; `percentage` = inteiro 1 a 100; `fixed` = reais convertidos. Campo vazio vira ausente
    (`emptyToUndefined`), nunca 0. O input do formulário deve ser texto (`inputMode="decimal"`),
    não `type="number"`: "1.50" é recusado (ponto é milhar em pt-BR).
  - Limitação conhecida: erros do desconto só aparecem depois de corrigidos os outros campos
    (a regra roda num `transform` no fim do schema).
- Pronto na Etapa 3 (branch `feat/listagem-propostas`):
  - Listagem em `app/admin/propostas/page.tsx`: `page` é a casca (título + `<Suspense>`), e
    `ListaPropostas` (async) faz a query (`where deletedAt isNull`, `with client`, `orderBy createdAt desc`).
    Cache Components do Next 16 está ligado (padrão do create-next-app): acesso ao banco fora de
    `<Suspense>` dá erro de prerender, então toda leitura de dados vai dentro de um componente
    async envolvido por Suspense.
  - Colunas: título, cliente, status (`_components/status-badge.tsx`, traduz draft/sent/approved),
    data de criação. Estado vazio e esqueleto de carregamento prontos. Sem link por linha ainda.
  - Layout do admin em `app/admin/layout.tsx` + `app/admin/_components/` (`sidebar`, `header`,
    `nav-link`, `icons`): menu lateral (Propostas ativo; Clientes e Modelo de textos "em breve"; Sair
    desabilitado até a Etapa 8) e header só com o usuário. Usuário e e-mail são constantes provisórias
    no layout (virão da sessão do Better Auth na Etapa 8). Tokens `admin-*` e `.admin-shell` em
    `app/globals.css`. No mobile o menu vira barra no topo só com ícones.
  - Dados de teste: `db/seed-dev.ts` (1 cliente + 1 proposta; rodar UMA vez, `public_token` é único):
    `node --env-file=.env.local db/seed-dev.ts`.
  - `PRODUCT.md` na raiz (contexto do produto para a skill de design Impeccable).
- Etapa 2 (Schema) concluída: tabelas migradas no Neon e seed rodado
- Pronto (visual, fora do fluxo): modelo da página pública em `app/proposta/[token]/page.tsx`,
  componentes em `app/proposta/_components/`, textos fixos em `lib/proposal-content.ts`,
  cálculos em centavos em `lib/proposal-calc.ts` e dados falsos em `lib/proposal-mock.ts`.
  Ainda não ligada ao banco. A copy dos textos fixos está FINAL (revisada) e pronta para o seed.
  - Seleção de pagamento: `app/proposta/_components/payment-choice.tsx` (Client Component:
    escolha da forma + parcelas 1 a 10 no cartão; botão de aprovar travado até escolher).
    Estado só na tela; a Server Action de aprovar (Etapa 7) ainda não existe.
  - Selos "10% de desconto" (Pix) e "até 10x sem juros" (cartão) estão fixos no componente,
    não no `FixedContent`. Se as regras mudarem, editar o código.
  - Convenção `*destaque*` só funciona onde a página usa `<Rich>` (títulos, intros, parágrafos
    do "sobre"); NÃO usar em campos impressos direto (items das vantagens, métodos de pagamento,
    manutenção).
- Pronto na Etapa 2: schema completo em `db/schema.ts` (`clients`, `proposal_template`, `proposals`,
  `proposal_items` + enums `client_type`, `proposal_status`, `discount_type`, `payment_method`).
  Primeira migration gerada (`drizzle/20261010022922_clever_zuras`) e aplicada no Neon (4 tabelas conferidas).
  Migrations seguintes (`payment_method` e `card_installments` em `proposals`) também aplicadas.
  Drizzle 1.0.0-rc.4: casing via `snakeCase.table(...)` (colunas camelCase no TS, snake_case no banco).
  Seed do modelo em `db/seed.ts` (`npm run db:seed`): busca o primeiro registro de `proposal_template`;
  se existe, atualiza `content` com `defaultFixedContent`; senão, insere. Idempotente, com `.catch`
  que encerra com `process.exit(1)`. Rodado e conferido no banco.
  - Scripts soltos (fora do Next) rodam com `node --env-file=.env.local` (Node 24 executa `.ts`):
    usar imports RELATIVOS com extensão `.ts` (o alias `@/` não funciona) e `import type` para tipos.
    `allowImportingTsExtensions` ligado no `tsconfig.json`.
    Vale para TODA a cadeia: `db/index.ts`, `db/relations.ts`, `db/schema.ts` e o que eles importam
    também precisam de imports relativos com `.ts` (o Node puro não resolve sem extensão; o Next sim).
- Pronto: Etapa 1 (Setup).
  - Projeto Next sem `src/`: `app/` e `db/` ficam na raiz (alias `@/*` aponta para a raiz).
  - Neon conectado; `DATABASE_URL` em `.env.local` (não vai para o git).
  - `drizzle.config.ts` na raiz: carrega `.env.local` via `dotenv` (`config({ path })`),
    valida `DATABASE_URL` (lança erro se faltar), schema em `./db/schema.ts`, migrations em `./drizzle`.
  - `db/index.ts`: driver WebSocket (`drizzle-orm/neon-serverless` + `Pool` + `ws`), `export const db`.
    Conexão testada com `node --env-file=.env.local`.
  - Preparação da Etapa 3 (concluída): `db/relations.ts` exporta `relations` via `defineRelations`
    (Drizzle v1): `proposals.client` (one), `proposals.items` (many) e `proposalItems.proposal` (one).
    `db/index.ts` passa `relations` (não `schema`) ao `drizzle({ client: pool, relations })`,
    habilitando `db.query.<tabela>.findMany({ with: ... })`. Docs: orm.drizzle.team/docs/relations-v2.
- Decisões tomadas:
  - Driver WebSocket (opção A), para ter transações interativas (`db.transaction`).
  - Sem pasta `src/`.
  - Manter `.env.local` (não renomear para `.env`).
  - `clients` sem coluna `empresa`: o campo `name` guarda o nome da pessoa (PF) ou da empresa (PJ).
  - `clients` sem `updatedAt` (sem valor prático por ora); manter em `proposals` e `proposal_template`.
  - Datas com `timestamp({ withTimezone: true })` (timestamptz, UTC no banco).
  - Telefone guardado só com dígitos (55 + DDD + 9 dígitos = 13); formato validado pelo Zod.
  - `proposal_template.content` será uma coluna `jsonb` única (opção B), tipada com `.$type<...>()`;
    o tipo das seções fixas é definido fora da tabela para reutilizar em `proposals.fixedContent`.
  - Enums reais do Postgres (`pgEnum`) para tipo de cliente, status da proposta e tipo de desconto.
  - Soft delete: coluna `deleted_at` (nula = ativa) em `clients` e `proposals`; toda consulta
    deve filtrar `deleted_at IS NULL`. `proposal_items` sem soft delete.
  - FKs sem `onDelete` (padrão: bloqueia exclusão real), para manter o histórico.
  - `public_token` gerado no código (não no banco), máx. 24 caracteres (`varchar(24)`), aleatório seguro.
  - Hospedagem é valor ANUAL (`hosting_annual`).
- Pendências:
  - Aviso `MODULE_TYPELESS_PACKAGE_JSON` ao rodar o seed (inofensivo): resolver com `"type": "module"`
    no `package.json` só se incomodar, checando antes se não afeta o Next/Drizzle Kit.
  - `@types/node` está em `^20`, mas o Node é 24: alinhar.
  - Desconto fixo maior que o subtotal: só dá para validar com os itens (Etapa 5).
  - Página pública: o tipo `Bonus` do mock (`lib/proposal-mock.ts`) ainda não tem `value`; ao ligar
    a página ao banco, mostrar o valor riscado + selo "Grátis" (parte visual, pode delegar).
  - Apagar `zod-teste.ts` da raiz (arquivo de estudo, não deve ir para o git).
  - Zod: `paymentMethod` e `cardInstallments` (obrigatório se `card`, proibido nos outros,
    1 a 10; o banco não garante). `paymentMethod` e `approvedAt` andam juntos.
  - Opcional: `check` no banco para `card_installments` entre 1 e 10 (hoje só o Zod).
  - `eslint-config-next` aparece como `^14.2.35` no package.json, mas o `next` é 16.x: checar/corrigir.
  - Hot reload do Next pode criar vários pools em dev; tratar só se aparecer erro de excesso de conexões.
  - `proposals.client` vem nulo no tipo (relação `one` é opcional por padrão no Drizzle v1), por isso
    a tela usa `client?.name`. Se `clientId` é `notNull`, declarar a relação como obrigatória em
    `db/relations.ts` (conferir `optional: false` na doc de relations v2).
  - `.impeccable/review/` (capturas de tela da skill de design) provavelmente deve entrar no `.gitignore`.
  - Itens "em breve" do menu (Clientes, Modelo de textos) e a listagem sem link por linha: ligar
    quando as telas existirem.
- Decisões da Etapa 4:
  - Formulário com seletor "Cliente existente" / "Cliente novo" (opção C): existente = só selecionar;
    novo = campos de cadastro.
  - Bônus: catálogo no código + cópia (jsonb) na proposta (opção A).
  - Autenticação da action enquanto o login não existe (opção A): função `requireUser()`
    provisória, chamada em toda action, com `TODO` claro; a Etapa 8 troca só o corpo dela.
  - Server Action chamada por objeto, não por `FormData` (opção A): combina com o payload aninhado
    (`client.*`, lista de bônus) e com o formulário interativo.
  - Cliente novo é inserido DENTRO da mesma `db.transaction` da proposta (atomicidade: sem cliente órfão).
    Dentro do callback, sempre `tx`, nunca `db`.
- Próximo passo: Etapa 5 (itens e valores), em modo mentor. Antes de começar, decidir onde os itens
  entram: no mesmo formulário de criação (itens no payload, `proposal_items` inseridos na mesma
  transação) ou numa tela de edição do rascunho. Lembrar: `lib/proposal-calc.ts` já tem os cálculos em
  centavos; não salvar subtotais/total; desconto fixo maior que o subtotal só se valida com os itens;
  proposta enviada não pode mais ser editada.
