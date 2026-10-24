# Sobre este projeto
Sistema de gestão pessoal para minha atuação como prestador de serviços
de tecnologia (sites institucionais, landing pages e sistemas sob medida).
Uso individual: apenas eu acesso o sistema. A única parte acessada por
terceiros é a página pública da proposta, aberta pelo cliente via link.

# Seu papel: mentor e executor
Mudança de modo (14/10/2026, início da Etapa 7): você continua sendo mentor (explica
conceitos, sugere estruturas), mas agora TAMBÉM escreve o código. Eu fico com a
orquestração e a revisão; você faz o grosso.

## Regras
- Pode escrever e editar arquivos do projeto sem pedir a cada vez, inclusive schema,
  Server Actions, validação, auth e banco.
- Antes de implementar algo com decisão de arquitetura, apresente opções com prós e
  contras e deixe eu decidir.
- Explique o que fez e o PORQUÊ (conceitos de Next/React/Drizzle, paralelos com Java),
  para eu conseguir revisar e aprender com o código.
- Siga as "Regras do projeto" (auth + Zod em toda action, centavos, etc.) e me avise
  se algo fugir delas.
- Em erros, investigue e explique a causa, não só a correção.
- Indique a documentação oficial quando for útil.
- Não faça commit nem push sem eu pedir. Perguntar antes de rodar `npm run dev`.
- Responda em português.

## Como conduzir a conversa
- Em cada passo, diga: em que etapa estamos, o que vamos fazer e PARA QUÊ.
- Tarefas grandes em passos pequenos, para eu revisar cada um.
- Respostas curtas.

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
- Modo dark: a ÁREA ADMINISTRATIVA (`app/(privado)/`) é em modo dark, com visual minimalista,
  profissional e pegada de gestão/dashboard. A página pública da proposta continua clara
  (marfim). Rotas (decisão de 16/10/2026, substitui o prefixo `/admin` da Etapa 3): o sistema NÃO tem
  prefixo. Pastas são grupos de rota do Next (o nome entre parênteses não aparece na URL):
  `app/(privado)/` = área logada (`/propostas`, `/propostas/nova`, `/propostas/[id]/editar`, futuras
  `/clientes`...), que compartilha `app/(privado)/layout.tsx` (menu lateral + header); `app/(publico)/` =
  `/login` e `/proposta/[token]` (a URL pública da proposta NÃO mudou, links já enviados continuam valendo).
  Segurança POR PADRÃO: o `proxy.ts` protege TUDO e só libera uma lista curta (`proposta/`, `login`,
  `api/auth/`, `_next/`, arquivos com extensão). Rota nova nasce protegida; para ser pública, entra no
  `matcher` de propósito. Cuidado: `proposta/` tem a barra para não liberar `/propostas`.

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
     `pix | split | card`; `cardInstallments` (inteiro de 1 a 3) obrigatório se `card`
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
  cartão, escolhe também o número de parcelas (1 a 3).
- Decisão (14/10/2026): a proposta NÃO é travada ao ser enviada; continua editável (edição
  pronta desde 15/10/2026, ver "Pronto: edição de proposta"). Como o cliente vê a página ao vivo
  pelo token, editar uma proposta já enviada muda o que ele vê. Depois de APROVADA, a proposta
  NÃO pode mais ser editada (`updateProposal` recusa `approved`).
- Serviços futuros (ex.: manutenção) viram uma proposta nova.
- Sem numeração própria, sem validade e sem expiração por enquanto.
- Aprovação: aparece no sistema e avisa o dono por NOTIFICAÇÃO PUSH no celular (ver "Pronto: notificação push"); email fica para depois.

## Seções da proposta (na ordem da página)
Fixas = vêm do modelo, iguais para todos. Variáveis = preenchidas por proposta.
   (antes da capa, na 1ª visita do cliente, há um convite de abertura em tela cheia; ver "Pronto: convite de
   abertura")
0. Capa (título da proposta + card flutuante com o nome/logo do cliente; variável)
1. Quem sou eu (fixa)
2. Vantagens de trabalhar comigo (fixa)
3. "Da aprovação ao site no ar" / processo (fixa, 4 passos: Início, Layout, Desenvolvimento, Entrega), com o
   card de prazo de entrega (prazo variável, em DIAS ÚTEIS, contado do recebimento do briefing e dos materiais;
   o tempo de resposta do cliente não conta). Logo abaixo dos passos: a nota das rodadas de ajustes
   (`process.adjustments`: até 2 por etapa, cada rodada = lista única) e, por último, a nota dos 60 dias
4. Portfólio / projetos (fixa, 2 projetos por enquanto)
5. Investimento (um card único, dividido em 4 partes, cada uma com divisória + rótulo + parágrafo curto;
   ordem decidida em 15/10/2026 para o cliente entender que o que paga AGORA é só o projeto):
   1) O projeto: serviços solicitados, itens, descontos e total (variáveis). Item pode ter ESCOPO (ver
      "Escopo do item"): setinha ao lado do item, abre/fecha, já vem ABERTO;
   2) Seus bônus (catálogo fixo; escolho quais valem em cada proposta; cada card mostra o valor
      agregado RISCADO com o selo "Grátis");
   3) Forma de pagamento (fixas; valores do Pix e das parcelas calculados na exibição; o cliente
      escolhe uma; aqui é só SELEÇÃO, ele pode escolher e não aprovar);
   4) Plano mensal (hospedagem e manutenção; variável), ANTES do botão "Aprovar proposta" para o
      cliente ver tudo antes de aprovar.
6. FAQ / perguntas frequentes (fixa)
7. Fechamento com o botão "Aprovar proposta"

Removidas do plano original: "Sobre o seu projeto" (o que será entregue vai nos serviços
do Investimento), "Contrato" e "Prazo e entrega" como seção própria (fundida no processo).
A página já lê a proposta do banco pelo token (ver "Estado atual").

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
- Hospedagem e manutenção: valor MENSAL opcional (só quando o cliente não tem hospedagem própria),
  separado do total do projeto, sem desconto e fora do cálculo do Pix. Começa depois dos 60 dias
  gratuitos. Coluna `hosting_monthly` (centavos; renomeada de `hosting_annual` em 16/10/2026, o plano deixou
  de ser anual); o valor cobre hospedagem E manutenção e é VARIÁVEL por proposta (ex.: 7900 = R$ 79/mês).
  Manutenção = manter o site no ar + até 3 alterações de conteúdo por mês (textos, fotos, telefone, endereço);
  página, seção ou funcionalidade nova NÃO entra (vira proposta nova).
- Domínio: contratado pelo cliente, não aparece na proposta.
- Hospedagem e manutenção: 60 dias grátis após a entrega, para TODOS os clientes (decisão de 14/10/2026),
  com até 3 alterações por mês. É um BÔNUS OBRIGATÓRIO do catálogo ("60 dias de hospedagem e manutenção");
  depois disso segue o PLANO MENSAL (texto fixo da página; o valor aparece no investimento). A página mostra
  "Primeiros 60 dias: Grátis → Depois R$ X/mês" (X = `hosting_monthly`, sem divisão por 12 nem parcelas) e os
  selos "Nada a pagar agora" e "Fora do total do projeto".
- Bônus (decisão): catálogo FIXO em `lib/proposal-bonuses.ts` (Google Meu Negócio, Painel de
  métricas, 60 dias de hospedagem e manutenção), pensado para site institucional. O de 60 dias é
  OBRIGATÓRIO (`isRequiredBonus`: o servidor inclui sempre; no formulário aparece marcado e travado).
  Nos outros, em cada proposta só escolho quais valem (o motivo de tirar um: o cliente já tem ou não
  quer). O navegador manda só
  os IDS; o servidor copia título, descrição e valor do catálogo para `proposals.bonuses` (a "foto").
  O `value` (centavos) é só referência exibida riscada; bônus não é cobrado e nunca entra no total.
  EXCEÇÃO: o valor riscado do bônus de 60 dias é CALCULADO na exibição = 2 × `hosting_monthly` da proposta
  (`bonusDisplayValue` em `lib/proposal-bonuses.ts`; `value` do catálogo = 0, não usado). Sem mensalidade
  (cliente com hospedagem própria) não aparece valor riscado, só o selo "Grátis".
  Id de bônus repetido é BARRADO (refine), não corrigido.

## Escopo do item (decisão de 16-17/10/2026; opcional por item)
- `proposal_items.scope` (jsonb, nulo = item sem escopo e sem setinha). Tipo `ItemScope` em `lib/proposal-scope.ts`:
  `pages` (lista de `{ name, sections[] }`), `included` (pílulas de "Incluso no site") e `notIncluded` (pílulas
  de "Não incluso"). Site de página única = 1 página SEM nome; com mais de uma, todas têm nome.
- Formulário: bloco recolhível "Escopo do item (opcional)" em cada item: páginas (nome + seções, uma por linha;
  "Adicionar página"/"Remover página") e dois grupos de pílulas ("Incluso no site" e "Não incluso") sem catálogo:
  digita e adiciona (Enter/botão), "×" exclui qualquer uma. Zod em `lib/schemas/proposal-item.ts`
  (`resolveItemScope`): tudo vazio = `null`; até 10 páginas, 20 seções por página, 20 pílulas por grupo, 100
  caracteres por texto, sem repetição (sem diferenciar maiúsculas).
- Página pública, ao abrir o item: descrição FIXA ("Site institucional sob medida, responsivo para celular."),
  pílulas "Página única"/"N páginas" e "N seções" (CALCULADAS da lista, nada guardado; `scopeCounts`), páginas com
  suas seções, "Incluso no site" e "Não incluso" como pílulas e a linha fixa "Qualquer item fora deste escopo é
  orçado à parte." (constantes `SCOPE_DESCRIPTION` e `SCOPE_OUT_OF_SCOPE_NOTE` em `lib/proposal-scope.ts`; não são
  digitadas nem guardadas).
- O escopo sai e entra com os itens: `updateProposal` apaga e reinsere `proposal_items` junto com o `scope`.

## Formas de pagamento (escolhidas pelo cliente ao aprovar)
- `pix`: 100% à vista no Pix, com 10% de desconto
- `split`: 50% na entrada + 50% na entrega
- `card`: cartão de crédito em até 3x sem juros (parcela = total ÷ n, arredondada em
  centavos, calculada na exibição)
- Gateway: Asaas.

## Modelo de dados
- clients: id, tipo (PF | PJ, enum `client_type`), nome (curto, aparece na capa), email (opcional),
  telefone (= WhatsApp, 13 dígitos), logo_url, criado em, deleted_at (soft delete), e os DADOS DO CONTRATO
  (todos opcionais, preenchidos na tela de Clientes; ver "Pronto: tela de Clientes"): legal_name (nome completo /
  razão social), document (CPF 11 ou CNPJ 14 dígitos, só números), zip_code, street, address_number,
  address_complement, neighborhood, city, state (UF), legal_rep_name / legal_rep_document / legal_rep_role
  (responsável legal, só PJ)
- proposal_template: id, textos das seções fixas, atualizado em
  (as seções fixas são: about, advantages, portfolio, process, payment, delivery e faq;
  tipo `FixedContent` em `lib/proposal-content.ts`)
- proposals: id, public_token (aleatório, único), client_id, título,
  bonuses (jsonb, array de `ProposalBonus` {id, title, description, value em centavos};
  notNull, default `[]`), delivery_days (prazo),
  discount_type (percentage | fixed | nulo, enum `discount_type`), discount_value,
  hosting_monthly (centavos, opcional), fixed_content (jsonb, cópia do modelo),
  status (enum `proposal_status`: draft | sent | approved), sent_at, approved_at,
  payment_method (enum `payment_method`: pix | split | card; nulo até a aprovação),
  card_installments (smallint, 1 a 3; nulo se o método não for `card`),
  criado em, atualizado em, deleted_at (soft delete)
  (`about_project` NÃO foi criada: a seção deixou de existir; adicionar depois se mudar de ideia)
- proposal_items: id, proposal_id, descrição, quantidade,
  unit_price (centavos), discount_type, discount_value, scope (jsonb opcional, ver "Escopo do item"),
  posição (ordem de exibição)
- Tabelas de usuário e sessão: geradas pelo Better Auth.

## Status da proposta
rascunho → enviada → aprovada
(Schema preparado para receber novos status no futuro, ex.: arquivada/recusada.)

## Decisões pendentes
- Status para propostas não aprovadas: "arquivada", "recusada" ou nenhum.
- Incluir ou não CPF/CNPJ do cliente na PÁGINA da proposta (o dado já existe em `clients.document`, usado só no contrato).
- Tela de Clientes: busca automática de CEP (ViaCEP) e máscaras (CPF/CNPJ, CEP, telefone) ficaram para depois;
  criar cliente isolado e arquivar cliente também. Arquivo antigo da logo fica órfão no Blob ao trocar (aceito).
- Tela para editar os textos do modelo.
- Portfólio: fixo no modelo ou escolher projetos por proposta.
- Notificação por EMAIL quando a proposta for aprovada (adiada em 17/10/2026; o push já cobre o aviso).
- `about_project`: remover da tabela e do formulário (a seção deixou de existir)?
- Detalhe de cada serviço (ex.: "Design + Implementação"): criar campo em `proposal_items`?
  Hoje a página mostra só descrição e quantidade.
- E-mail do cliente (decisão de 24/10/2026): OPCIONAL na criação da proposta (`clients.email` nulável, migration
  `20261024160514_wandering_mystique`). Preenchido depois da aprovação pela tela de Clientes.
- Trocar a logo de um cliente EXISTENTE: FEITO em 24/10/2026, de dois jeitos (a logo é do CLIENTE, então vale
  para todas as propostas dele): no formulário de EDITAR PROPOSTA (`updateProposal` aceita `logoUrl`: ausente =
  não mexe, `null` = remove, URL = troca) e na tela de Clientes (`updateClient`). Reaproveitam `uploadClientLogo`.
- Logo do cliente (em produção desde 15/10/2026; migration `client_logo_url` e `db:seed` aplicados na
  `production` ANTES do merge; sem teste prévio em preview, por decisão): Vercel Blob (store público,
  variável `BLOB_READ_WRITE_TOKEN`), URL em `clients.logo_url`.
  `uploadClientLogo(FormData)` em `app/(privado)/clientes/actions.ts`: `requireUser()` + Zod (File, até 2 MB) +
  tipo pelos BYTES (`lib/logo-file.ts`: png/jpg/webp, SVG recusado) + nome aleatório em `logos/`. O
  `createProposal` recebe a URL; `lib/schemas/client.ts` só aceita https `*.public.blob.vercel-storage.com`
  em `/logos/`. `serverActions.bodySizeLimit` = 3mb em `next.config.ts` (vale p/ todas as actions). A capa
  (`ClientCard`) mostra a logo ou as iniciais. Arquivo órfão no Blob se desistir da proposta (aceito).
- Texto do botão final da página ("formalizarmos o contrato"): ajustar, já que não há
  mais seção de contrato.

## Etapas
1. Setup: criar projeto Next, conectar ao Neon, configurar Drizzle. (CONCLUÍDA)
2. Schema: escrever as tabelas no Drizzle, rodar a primeira migration
   e criar o seed do modelo de textos.
3. Listagem: página que lista propostas lendo do banco (Server Components). (CONCLUÍDA)
4. Criar proposta: formulário + Server Action + validação com Zod
   (cliente novo ou existente, título, bônus, prazo, hospedagem, desconto). (CONCLUÍDA)
5. Itens e valores: adicionar/remover itens, descontos e cálculo dos totais
   (Client Components, estado). (CONCLUÍDA)
6. Página pública: rota com token mostrando a proposta completa com a identidade visual. (CONCLUÍDA)
7. Enviar e aprovar: marcar como enviada (sem travar a edição), gerar o link,
   botão de aprovar na página pública. (CONCLUÍDA)
8. Login: Better Auth protegendo todo o sistema, exceto a página pública
   e a action de aprovar. (CONCLUÍDA)
9. Deploy na Vercel. (CONCLUÍDA)

# Estado atual
- Etapa atual: MVP concluído e no ar. Etapas 1 a 9 concluídas (ver "Pronto na Etapa 8" e "Pronto na Etapa 9").
- Branches e ambientes (decisão de 14/10/2026, Etapa 9):
  - Fluxo Git: `feat/*` → `dev` (branch de integração) → `main` (produção, Production Branch da Vercel).
  - Neon conectado à Vercel (integração com preview branching): cada branch Git com deploy de preview ganha
    uma branch do Neon `preview/<branch>`, copiada da `production` NA CRIAÇÃO (não sincroniza depois e
    NÃO recebe migrations sozinha). Tudo feito até a Etapa 8 foi aplicado na branch `production`.
  - Desenvolvimento local: `.env.local` aponta para `preview/dev` (cópia da `production`), não mais para a
    `production`. Não deletar a branch Git `dev` (a integração apaga a branch do Neon junto).
  - Duas URLs de conexão: `DATABASE_URL` (pooled; usada pelo app em `db/index.ts`) e `DATABASE_URL_UNPOOLED`
    (direta; usada pelo `drizzle-kit` quando existe, com fallback para `DATABASE_URL`).
  - Migrations: `npm run db:generate` e `npm run db:migrate` (atingem o banco do `.env.local`, hoje o de dev).
    Gerar na `feat/*`, aplicar na `preview/dev`; ao promover `dev` → `main`, aplicar na `production` ANTES do
    deploy do código que depende dela. NÃO colocar `migrate` dentro do `build` por ora.
  - Produção (desde 17/10/2026): `npm run db:migrate:prod` e `npm run db:seed:prod` (`drizzle.prod.config.ts`
    e `node --env-file=.env.production.local`), que leem `.env.production.local` (ignorado pelo git; contém
    `DATABASE_URL` com pooler e `DATABASE_URL_UNPOOLED` direta da branch `production` do Neon) e imprimem o host
    alvo. Fluxo de publicação: backup (branch do Neon a partir da `production`) → `git merge dev` NA `main`, sem
    push → `db:migrate:prod` → `db:seed:prod` → `git push` (migration antes do push, porque um rename quebra o
    código antigo durante o build). As migrations só rodam em branch que já tem os arquivos delas (por isso o merge antes).
  - Antes do lançamento: limpar da `production` os dados de teste (proposta do `seed-dev` e testes).
  - Preview e login: `BETTER_AUTH_URL` é fixa e cada preview tem outro domínio; para Preview não definir a
    variável (o Better Auth infere da requisição) ou derivar de `VERCEL_URL`. Confirmar na doc ao configurar.
- Pronto na Etapa 8 (Login, Better Auth 1.7):
  - `lib/better-auth.ts`: `betterAuth` com adaptador Drizzle, e-mail e senha, `disableSignUp: true` (sem cadastro
    pela rede) e `nextCookies()` por último. `db/auth-schema.ts`: `user`, `session`, `account`, `verification`
    (escrito à mão no padrão `snakeCase.table`; as chaves TS são o contrato com o adaptador, não renomear).
    `drizzle.config.ts` lista os dois arquivos de schema. Migration `20261014173020_better_auth` aplicada.
  - `lib/auth.ts`: `getOptionalUser()` (sessão via `auth.api.getSession({ headers })`, ou `null`) e
    `requireUser()` (lança erro sem sessão). Assinaturas inalteradas.
  - `proxy.ts` (nome do middleware no Next 16): rota protegida sem cookie de sessão vai para `/login?next=...`
    (desde 16/10/2026 o matcher é uma LISTA DE EXCEÇÕES, ver "Modo dark"/rotas; antes era só `/admin/*`).
    Só confere se o cookie EXISTE; a validação real é `requireUser()` nas actions e `SessionHeader` no
    `app/(privado)/layout.tsx` (redireciona para `/login` se a sessão for inválida). `/proposta/` e `/api/auth/` ficam fora.
  - `app/api/auth/[...all]/route.ts`: handler do Better Auth.
  - Login: `app/(publico)/login/` (página, `LoginForm`, actions `login` e `logout`). `lib/schemas/login.ts` tem `loginSchema` e
    `safeNext` (anti open redirect: só caminho interno `/...`, recusa `//`, `/\`, `/login` e `/api`; padrão
    `/propostas`). Erro de login é sempre genérico.
  - Usuário criado por script: `db/create-user.ts` (ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD em variáveis de
    ambiente; senha mínima 12; usa `auth.$context.internalAdapter` porque `signUpEmail` respeita `disableSignUp`).
    Rodar com `node --env-file=.env.local db/create-user.ts` (no Git Bash: `VAR=... node ...`).
  - Env novas: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Na Vercel usar outro secret e a URL real; criar o
    usuário também no banco de produção.
  - Limitações: o layout não re-renderiza em navegação client-side (sessão expirada com a aba aberta só é
    barrada na próxima ação/recarga); o rate limit do Better Auth só vale em produção por padrão.
- Pronto na Etapa 5 (itens entram no MESMO formulário de criação, opção A; a edição veio depois, ver "Pronto: edição de proposta"):
  - `lib/schemas/discount.ts`: `emptyToUndefined`, `discountFields` e `resolveDiscount` (regra do desconto:
    tipo + valor juntos ou nenhum; percentage = inteiro 1 a 100; fixed = reais → centavos), usados pelo item.
    `lib/schemas/proposal.ts` ainda tem a mesma lógica inline (refatorar para usar o helper é opcional).
  - `lib/schemas/proposal-item.ts`: `proposalItemSchema` (descrição 3 a 200, quantidade inteira 1 a 1000,
    `unitPrice` texto em reais → centavos, desconto opcional). Desconto fixo maior que quantidade × preço é
    recusado (`superRefine`, erro em `discountValue` do item).
  - `proposalSchema.items`: `.min(1)` e `.max(50)`.
  - `createProposal`: recusa desconto geral FIXO maior que o subtotal (`projectSubtotal`, antes da transação,
    volta como `formError`); insere `proposal_items` na MESMA transação da proposta (`.returning({ id })`,
    `position` = índice do array).
  - `lib/proposal-calc.ts`: tipo de desconto renomeado de `"percent"` para `"percentage"` (igual ao enum do
    banco e ao Zod; mock e página pública ajustados). Nova `toDiscount(type, value)` converte as duas colunas
    do banco em `{ type, value } | null` e LANÇA erro se só uma vier preenchida.
  - Formulário (`proposal-form.tsx`): seção "Serviços e itens" (1 a 50 linhas, estado em texto com `key` só
    da tela). Com `cacheComponents` o Next mantém a página anterior montada (e o estado): `ProposalForm` é
    uma casca com `key` que muda no sucesso, recriando o formulário vazio. O erro (`formError` ou "há campos
    com erro") aparece junto ao botão, não no topo.
  - Listagem: coluna "Total" calculada na leitura (`items` + desconto geral → `projectTotal`).
    Propostas antigas sem itens mostram R$ 0,00.
  - Limitações conhecidas: erros dos itens aparecem numa lista única acima das linhas (sem apontar o item;
    para isso, `z.treeifyError`); com erro de campo o formulário não rola nem foca o campo.
- Pronto na Etapa 4 (branch `feat/criar-proposta`):
  - `lib/auth.ts`: `requireUser()` (provisória na Etapa 4; agora usa a sessão real, ver Etapa 8).
  - `app/(privado)/propostas/actions.ts`: `createProposal(input: unknown)`. Fluxo: `requireUser()` →
    `proposalSchema.safeParse` → foto dos bônus (`bonusCatalog.filter` pelos ids validados) →
    `public_token` (`randomBytes(18).toString("base64url")` = 24 caracteres) → `db.transaction`
    (cliente existente: confere existência e `deletedAt` nulo; novo: insere com `.returning`;
    copia `proposal_template.content` para `fixedContent`; insere a proposta). Retorno: `{ ok: true }`
    ou `{ ok: false, fieldErrors, formError }` (`as const`). `ClientNotFoundError` aborta a transação e
    vira `formError` fora dela; "template não encontrado" continua sendo `throw` (erro de configuração).
    Testada manualmente (cliente novo, dados inválidos, cliente inexistente com rollback).
  - `app/(privado)/propostas/nova/page.tsx`: casca + `<Suspense>`; `FormularioComClientes` (async,
    `connection()`) lê `id` e `name` dos clientes ativos e passa por prop ao formulário.
  - `app/(privado)/propostas/nova/_components/proposal-form.tsx`: Client Component (estado + `onSubmit`
    chamando a action com objeto, opção A). Envia só TEXTO; a conversão para centavos é do Zod.
    Em sucesso, `router.push("/propostas")`. Erros do cliente aparecem em lista única (o
    `z.flattenError` só agrupa pela chave de topo `client`); para erro por campo, usar `z.treeifyError`.
  - Botão "Nova proposta" na listagem (`app/(privado)/propostas/page.tsx`).
  - Itens e total entraram na Etapa 5 (ver acima).
- Base da Etapa 4 (validação e catálogo):
  - `lib/proposal-bonuses.ts`: `bonusCatalog` (ids `google-meu-negocio`, `painel-metricas`,
    `hospedagem-manutencao-60-dias`, renomeado em 14/10/2026 antes de haver proposta real),
    `value` em centavos (15000, 20000, 12000; o de 60 dias = 2 meses × R$ 60, alterado em 15/10/2026),
    tipos `BonusId` e `ProposalBonus` e a tupla `bonusIds` para `z.enum`.
  - `db/schema.ts`: `proposals.bonus` (text) trocado por `bonuses` (jsonb, notNull, default `[]`).
    Migration `drizzle/20261013182456_misty_black_widow` aplicada no Neon (o texto de teste do
    `seed-dev` foi perdido, sem problema). Comandos: `npm run db:generate` e `db:migrate`
    (scripts do package.json, ver "Branches e ambientes"). Ao gerar, escolher "create column" (não rename) quando
    o tipo da coluna muda.
  - `lib/money.ts`: `parseReaisToCents(texto)` converte "1.500,00" / "R$ 19,99" em centavos sem
    float; devolve `null` se inválido ou acima do limite do integer.
  - `lib/schemas/client.ts`: `clientSchema` = `z.discriminatedUnion("clientMode", [new, existing])`.
    `new`: nome (3 a 100), e-mail (até 256), telefone (limpa símbolos e exige 13 dígitos), tipo PF/PJ.
    `existing`: `clientId` UUID.
  - `lib/schemas/proposal.ts`: `proposalSchema` e `ProposalInput`. `client` aninhado; `title` (5 a 100,
    trim); `deliveryDays` (inteiro > 0); `bonuses` (ids do catálogo, sem repetição, default `[]`);
    `hostingMonthly` (era `hostingAnnual`) e `discountValue` recebem TEXTO em reais ("79,00") e entregam CENTAVOS (a
    conversão é feita no schema, não no formulário); `discountType` + `discountValue` vêm juntos ou
    nenhum; `percentage` = inteiro 1 a 100; `fixed` = reais convertidos. Campo vazio vira ausente
    (`emptyToUndefined`), nunca 0. O input do formulário deve ser texto (`inputMode="decimal"`),
    não `type="number"`: "1.50" é recusado (ponto é milhar em pt-BR).
  - Limitação conhecida: erros do desconto só aparecem depois de corrigidos os outros campos
    (a regra roda num `transform` no fim do schema).
- Pronto na Etapa 3 (branch `feat/listagem-propostas`):
  - Listagem em `app/(privado)/propostas/page.tsx`: `page` é a casca (título + `<Suspense>`), e
    `ListaPropostas` (async) faz a query (`where deletedAt isNull`, `with client`, `orderBy createdAt desc`).
    Cache Components do Next 16 está ligado (padrão do create-next-app): acesso ao banco fora de
    `<Suspense>` dá erro de prerender, então toda leitura de dados vai dentro de um componente
    async envolvido por Suspense.
  - Colunas: título, cliente, status (`_components/status-badge.tsx`, traduz draft/sent/approved),
    data de criação. Estado vazio e esqueleto de carregamento prontos. Sem link por linha ainda.
  - Layout do admin em `app/(privado)/layout.tsx` + `app/(privado)/_components/` (`sidebar`, `header`,
    `nav-link`, `icons`): menu lateral (Propostas e, desde 24/10/2026, Clientes ativos; Modelo de textos "em breve"; Sair
    desabilitado até a Etapa 8) e header só com o usuário. Usuário e e-mail são constantes provisórias
    no layout (virão da sessão do Better Auth na Etapa 8). Tokens `admin-*` e `.admin-shell` em
    `app/globals.css`. No mobile o menu vira barra no topo só com ícones.
  - Dados de teste: `db/seed-dev.ts` (1 cliente + 1 proposta; rodar UMA vez, `public_token` é único):
    `node --env-file=.env.local db/seed-dev.ts`.
  - `PRODUCT.md` na raiz (contexto do produto para a skill de design Impeccable).
- Etapa 2 (Schema) concluída: tabelas migradas no Neon e seed rodado
- Pronto na Etapa 6: página pública em `app/(publico)/proposta/[token]/page.tsx` lendo do banco pelo `public_token`
  (`db.query.proposals.findFirst` com `client` e `items` ordenados por `position`, dentro de componente
  async com `<Suspense>` e `connection()`), componentes em `app/(publico)/proposta/_components/`, textos fixos em
  `lib/proposal-content.ts` (copiados para `fixedContent` na criação) e cálculos em centavos em
  `lib/proposal-calc.ts`. Bônus aparecem com valor riscado + selo "Grátis". Na listagem do admin, botão
  "Ver página" por linha (abre a página pública em nova aba). Testada manualmente no navegador.
  `lib/proposal-mock.ts` foi apagado (sem uso). A copy dos textos fixos está FINAL (revisada).
  - Seleção de pagamento: `app/(publico)/proposta/_components/payment-choice.tsx` (Client Component:
    escolha da forma + parcelas 1 a 3 no cartão; botão de aprovar travado até escolher).
    Estado só na tela; a Server Action de aprovar foi ligada na Etapa 7.
  - Selos "10% de desconto" (Pix) e "até 3x sem juros" (cartão) estão fixos no componente,
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
  - Hospedagem é valor MENSAL (`hosting_monthly`; era anual até 16/10/2026).
- Pendências:
  - Aviso `MODULE_TYPELESS_PACKAGE_JSON` ao rodar o seed (inofensivo): resolver com `"type": "module"`
    no `package.json` só se incomodar, checando antes se não afeta o Next/Drizzle Kit.
  - Zod: `paymentMethod` e `cardInstallments` (obrigatório se `card`, proibido nos outros,
    1 a 3; o banco não garante). `paymentMethod` e `approvedAt` andam juntos.
  - Opcional: `check` no banco para `card_installments` entre 1 e 10 (hoje só o Zod).
  - `npm audit` aponta 5 "high" na cadeia `braces` → `eslint-config-next` (só lint, devDependency). NÃO rodar
    `npm audit fix --force` (faria downgrade do `eslint-config-next` para 14, incompatível com o Next 16).
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
- Pronto na Etapa 9 (Deploy, 14/10/2026): produção em https://gestao-nathannolacio.vercel.app/ (Production
  Branch = `main`). Variáveis na Vercel: `BETTER_AUTH_SECRET` (Sensitive; Production e Preview) e
  `BETTER_AUTH_URL` (SÓ Production; em Preview fica sem, o login funcionou inferindo da requisição);
  `DATABASE_URL*` vêm da integração Neon (não editar). Dados de teste foram apagados da `production`
  (`proposal_items` → `proposals` → `clients`; mantidos `proposal_template` e o usuário). Smoke test em
  produção aprovado (proteção do admin, login, criar/enviar/aprovar, "Sair"). No deploy (`NODE_ENV=production`,
  inclusive em preview) o botão "Voltar a rascunho" some e `revertToDraft` recusa; para tê-lo em preview
  seria preciso trocar `NODE_ENV` por `VERCEL_ENV` (decisão adiada).
- Próximo passo: MVP no ar, edição de proposta e tela de Clientes prontas. Candidatos (decidir): testes
  automatizados do cálculo (`lib/proposal-calc.ts`) e do `approveProposal`/`updateProposal`/`updateClient`,
  data de envio/aprovação na listagem, tela do modelo de textos, geração do contrato a partir dos dados do cliente.
- Pronto: tela de Clientes (24/10/2026; `tsc` e `eslint` passam, NÃO testada no navegador; migration
  `20261024162724_loving_moira_mactaggert`, só ADD COLUMN nulas, aplicada na `preview/dev`):
  - Menu "Clientes" ativo. `app/(privado)/clientes/page.tsx` lista clientes ativos (nome, tipo, CPF/CNPJ formatado,
    e-mail) com o selo "Pronto para contrato" / "Contrato: faltam N" (`lib/client-contract.ts`,
    `missingContractFields`, CALCULADO, nada salvo: nome completo/razão social, documento, e-mail, endereço e,
    em PJ, responsável legal). Cada linha leva a `app/(privado)/clientes/[id]/editar/page.tsx` (valida o `id` com
    `z.uuid()`, `notFound()` se inexistente/arquivado) e `_components/client-form.tsx` (Identificação + logo, Contato,
    Endereço, Responsável legal só em PJ). Reaproveita `Field` e `inputClass`, agora exportados de `proposal-form.tsx`.
  - `updateClient(input)` em `clientes/actions.ts`: `requireUser()` → `updateClientSchema`
    (`lib/schemas/client-update.ts`) → UPDATE `WHERE id AND deleted_at IS NULL`. Zod: campo vazio vira `null`
    (limpa a coluna); documento/CEP/CPF do responsável guardados só com dígitos; documento validado pelo TIPO
    (PF = CPF, PJ = CNPJ) com dígito verificador (`lib/document.ts`: `isValidCpf`, `isValidCnpj`, `formatDocument`);
    UF restrita às 27 siglas; em PF os campos do responsável legal são zerados. O tipo PF/PJ pode ser trocado.
  - `logoUrlSchema` agora é exportado de `lib/schemas/client.ts` (mesma regra: https, Blob nosso, `/logos/`).
- Pronto: edição de proposta (15/10/2026; testada manualmente: rascunho, enviada, aprovada e URL inválida;
  ainda NÃO está na `main`/produção, só na branch de trabalho; não há migration):
  - `updateProposal(input)` em `app/(privado)/propostas/actions.ts`: `requireUser()` → `updateProposalSchema`
    (`id` UUID + campos da proposta, SEM `client`: o cliente não troca na edição) → checagem do desconto
    fixo → transação: UPDATE com `WHERE id AND status IN ('draft','sent') AND deletedAt IS NULL` (atômico;
    sem linha = inexistente, removida ou aprovada) + DELETE e reinsert de `proposal_items` (`position` =
    índice). Escreve `title`, `deliveryDays`, `bonuses` (foto do catálogo), `hostingMonthly`, desconto e
    `updatedAt`; NÃO toca em `publicToken`, `fixedContent`, `status`, `sentAt` nem no cliente. Opcionais
    vazios gravam `null` explícito (`undefined` no `.set` do Drizzle é ignorado).
  - `lib/schemas/proposal.ts`: `proposalFields` (comuns) + `resolveGeneralDiscount`, usados por
    `proposalSchema` (com `client`) e `updateProposalSchema`. Helpers `fixedDiscountExceedsSubtotal` e
    `snapshotBonuses` na `actions.ts`, compartilhados com `createProposal`.
  - `lib/money.ts`: `formatCentsAsReais` (centavos → "1.500,00", só aritmética inteira) para preencher a edição.
  - Formulário único e bimodal em `app/(privado)/propostas/_components/proposal-form.tsx` (props em união
    discriminada `mode: "create" | "edit"`); no modo edit o cliente é só leitura e, se `sent`, há aviso de que
    o cliente vê a mudança ao vivo. Sem reset por `key` na edição.
  - Rota `app/(privado)/propostas/[id]/editar/page.tsx`: valida o `id` com `z.uuid()` (senão o cast do Postgres
    quebra), `notFound()` para inexistente/deletada/`approved`. Botão "Editar" na listagem (oculto em `approved`).
  - `NavLink` (`app/(privado)/_components/nav-link.tsx`): `usePathname()` dentro de `<Suspense>` (com fallback
    sem destaque), pois em rotas com segmento dinâmico o pathname é dado de runtime e bloqueava o prerender.
- `npm audit`: 5 "high" na cadeia `braces` → `eslint-config-next` (só lint). Não rodar `audit fix --force`.
- Pronto: rotas sem prefixo `/admin` + raiz abre no sistema (16/10/2026; sem migration; só no working tree/`dev`;
  `tsc` e `next build` passam, redirecionamento NÃO testado no navegador):
  - `app/admin/*` → `app/(privado)/*`; `app/proposta` e `app/login` → `app/(publico)/*` (`git mv`, histórico
    preservado; no Windows o `git mv` falha com o `npm run dev` ligado: parar o servidor antes). URLs privadas
    agora são `/propostas...`; referências atualizadas (sidebar, links da listagem, `revalidatePath`,
    `router.push`, imports `@/app/(privado)/...`, `safeNext`, `proxy.ts`). `app/page.tsx` faz
    `redirect("/propostas")` (sem sessão, o proxy leva ao login e volta); quando existir um dashboard, trocar o destino.
  - `.next/types` e `.next/dev/types` ficam obsoletos após mover pastas (erros de `tsc`): apagar ou rodar
    `npx next typegen`.
  - Responsividade do painel administrativo (16/10/2026; sem migration; só `tsc`, NÃO conferida no navegador
    por mim, aprovada por uso): no mobile o `Header` é a barra do topo (hambúrguer + "Gestão" à esquerda, avatar à
    direita); o hambúrguer abre uma gaveta (`mobile-menu.tsx`, `<dialog>` + `showModal()`) com o mesmo `SidebarNav`
    da sidebar (`sidebar-nav.tsx`), que só aparece em `md+`. Listagem de propostas: tabela em `md+`, cartões em grid
    abaixo disso (mesmo markup, classes `max-md:`). Inputs do formulário com 16px no mobile (evita zoom do iOS).
- Pronto: convite de abertura da página pública (15/10/2026; sem migration; só no working tree/`dev`;
  conferido no Playwright em desktop e celular, mas não em produção):
  - Componente `app/(publico)/proposta/_components/invite-gate.tsx` (Client Component) embrulha o `<main>` da
    `app/(publico)/proposta/[token]/page.tsx`. A proposta continua renderizada no servidor por baixo (inerte via ref, sem
    rolagem); o cliente vê um envelope dourado e clica em "Abrir proposta" para chegar ao Hero.
  - Quando aparece: só na 1ª visita por NAVEGADOR (`localStorage`, chave `proposal-invite:<token>`, lido com
    `useSyncExternalStore`: no servidor o valor é `null`, então o HTML já sai com a tela opaca, sem mostrar a
    proposta nem piscar o envelope para quem já abriu). Não aparece em proposta `approved` nem para o dono
    logado; `?convite=1` (só com sessão) força o convite para testar a animação. Decisão no servidor
    (`skipInvite`/`forceInvite` em `page.tsx`); sem JS o `<noscript>` esconde o convite. NÃO há registro no banco
    de "visualizada" (opção adiada: coluna `viewed_at` + action pública validada pelo token).
  - Visual: base no grafite do projeto (bordas `--color-grafite`, centro aquecido `#2c2720`), 5 ondas de seda em
    SVG (`SilkWave`: planos de profundidade com desfoque/opacidade/velocidade crescentes; formas `a/b/c`), bokeh
    dourado subindo, paralaxe com o ponteiro (variáveis CSS `--px`/`--py`, sem re-render) e duas faixas de texto
    em loop ("Proposta comercial" dourada em cima, "Sua proposta está pronta" translúcida embaixo), em sentidos
    opostos. As faixas ficam NO FLUXO do layout (acima e abaixo do conteúdo) para nunca cruzar o texto em telas
    baixas; o envelope encolhe por `svh`. Abertura: lacre some → aba gira → carta sobe → fade (~2,2s;
    `OPEN_MS` = 2300 deve ser sempre ≥ ao fim do fade). Keyframes (`marquee`, `wave-bob`, `bokeh`) em
    `app/globals.css`; `prefers-reduced-motion` desliga tudo, inclusive a paralaxe.
  - Custo conhecido: 5 SVGs com blur + bokeh animados podem pesar em celular antigo (primeiro corte: a onda de
    fundo, blur de 10px). Texto das faixas e do convite está FIXO no componente.
- Pronto: reorganização do card de Investimento na página pública (15/10/2026; sem migration; só no working
  tree/`dev`, ainda não conferida no navegador nem em produção):
  - Ordem: projeto → bônus → forma de pagamento → cobrança anual → botão "Aprovar proposta". Para a cobrança
    anual ficar ENTRE a seleção e o botão (que mora no `PaymentChoice`, Client Component com o estado), o
    `PaymentChoice` ganhou `children`, renderizado entre as opções e o botão; a `page.tsx` (Server Component)
    passa o bloco da cobrança anual por ali.
  - Padrão visual em `page.tsx`: constantes `partDivider`, `partLabel` (caixa-alta dourada, sem número) e
    `partIntro` (parágrafo cinza), usadas nas 4 partes. O título grande do pagamento (`payment.title`) não é
    mais exibido (continua no `FixedContent`); os parágrafos de projeto, bônus e cobrança anual estão FIXOS no
    código (como os selos), só o do pagamento vem do modelo (`payment.intro`).
  - (SUPERADO em 16/10/2026: agora é "Plano mensal", sem plano anual nem 12x.) Bloco da cobrança: dois blocos (Grátis → valor mensal; empilhados com seta para baixo no mobile) e selos
    "Nada a pagar agora" e "Fora do total do projeto".
  - Bônus de 60 dias: `value` passou de 6000 para 12000 (2 meses × R$ 60). Propostas existentes só mudam se
    editadas e salvas (a "foto" fica em `proposals.bonuses`). Em produção NÃO há propostas reais (confirmado
    em 16/10/2026), então não há dado antigo a corrigir. (SUPERADO: o valor riscado desse bônus agora é 2 × a
    mensalidade, calculado na exibição.)
- Pronto: ajustes da página de proposta de 16-17/10/2026 (contrato alinhado à proposta). Migrations NOVAS, aplicadas
  na `preview/dev` e, em 17/10/2026, também na `production` (com `db:migrate:prod` e `db:seed:prod`), nesta ordem:
  `20261016230113_hosting_monthly` (rename `hosting_annual` → `hosting_monthly`, sem perda de dados; atenção:
  valores antigos eram anuais), `20261016230649_proposal_scope` (cria `proposals.scope`) e
  `20261016232502_item_scope` (cria `proposal_items.scope` e APAGA `proposals.scope`; o escopo mudou de proposta
  para item). Sem proposta real em produção, o resultado final é o mesmo.
  - Textos fixos (`lib/proposal-content.ts`): processo com 4 passos e título "Da aprovação ao site no ar";
    `process.adjustments` (opcional no tipo: cópias antigas do modelo não têm); prazo em dias úteis ("a partir do
    recebimento do briefing e dos materiais"); FAQ com manutenção incluída no plano, 60 dias de "hospedagem e
    manutenção grátis", até 3 alterações/mês e pergunta "Em quanto tempo você responde?" (até 1 dia útil).
    Mensagem pós-aprovação: "Entrarei em contato em até 1 dia útil" + próximos passos (Contrato, Pagamento, Briefing).
  - Sem validade da proposta (decidido em 16/10/2026): continua sem expiração.
  - Cartão em até 3x sem juros (antes 10x): `MAX_INSTALLMENTS` em `payment-choice.tsx` e `.max(3)` em
    `lib/schemas/approve-proposal.ts`. Aprovações antigas com mais de 3 parcelas (só dados de teste) não casam
    com as opções do seletor.
  - A "foto" (`fixed_content`) das propostas existentes NÃO muda sozinha: após o `db:seed`, atualizar à mão as
    não aprovadas (`UPDATE proposals SET fixed_content = (template) WHERE status IN ('draft','sent')`, feito no dev
    por script descartável). Aprovadas ficam com o texto da aprovação, de propósito.
  - NÃO testado: o formulário do admin (páginas, seções, pílulas) e o fluxo de aprovação após estas mudanças;
    a página pública foi conferida no navegador (desktop) com um item de 2 páginas e outro de página única.
- Pronto: notificação push de proposta aprovada (commit `cac8342`, 16/10/2026; código revisado em 17/10/2026, sem
  falha grave encontrada; a entrega real no celular NÃO foi retestada nesta revisão). PWA + Web Push:
  - `app/manifest.ts` (PWA `standalone`, ícones em `public/icons/`) e `app/layout.tsx` (apple-touch-icon e
    `appleWebApp`): o iOS só libera push para app instalado na tela inicial. `public/sw.js` (service worker) mostra a
    notificação (sempre chama `showNotification`, exigência do iOS) e, ao clicar, abre/foca o app só em caminho
    interno (anti open redirect). `sw.js` e o manifest passam no `proxy.ts` por terem extensão.
  - Botão "Ativar notificações" (`app/(privado)/_components/push-toggle.tsx`, no menu): pede permissão DENTRO do
    clique, registra o SW, assina com a chave VAPID pública e chama `savePushSubscription`
    (`app/(privado)/notificacoes/actions.ts`: `requireUser()` + Zod `lib/schemas/push-subscription.ts` + upsert pelo
    `endpoint`). O Zod só aceita https dos hosts de push conhecidos (Apple, Google/FCM, Mozilla, Windows) para o
    servidor nunca postar num endereço qualquer (SSRF). Não há botão para DESATIVAR (só pelo navegador/iOS).
  - Tabela `push_subscriptions` (migration `20261016153742_push_subscriptions`): `user_id` (FK com cascade),
    `endpoint` (único), `p256dh`, `auth`, `created_at`. Um registro por aparelho.
  - `lib/push.ts`: `sendPushToOwner` envia para TODOS os aparelhos (`Promise.allSettled`, TTL 24h, urgência alta),
    apaga inscrições mortas (404/410) e NUNCA lança. `notifyProposalApproved(proposalId)` calcula o total na hora
    (nada salvo) e monta "<cliente> aprovou "<título>". <Pix à vista R$ X | 50% + 50% | Cartão Nx de R$ Y>".
  - Ligação: `approveProposal` (pública) chama `after(() => notifyProposalApproved(id))` DEPOIS do UPDATE de aprovação:
    uma falha no push não desfaz a aprovação. O push só dispara se o UPDATE aprovou (status `sent` → uma vez só).
  - Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (embutida no build), `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`. Sem elas o aviso
    é pulado com log, sem erro. NA VERCEL: conferir que as 3 existem no ambiente certo e que a migration
    `push_subscriptions` foi aplicada na `production` (sem a tabela o aviso falha em silêncio, no try/catch).
- Pronto: arquivar proposta e ícones na listagem (15/10/2026; testado manualmente; sem migration):
  - `archiveProposal(input)` em `app/(privado)/propostas/actions.ts`: `requireUser()` → Zod (`id` UUID) → UPDATE
    único que preenche `deletedAt` com `WHERE id AND status IN ('draft','sent') AND deletedAt IS NULL`
    (atômico). Decisão: arquivar = soft delete (sem novo status) e proposta APROVADA NÃO arquiva (é registro
    de venda; recusada no servidor). Depois de arquivada some da listagem e a página pública responde 404.
    Confirmação com `window.confirm` no cliente. Não há tela para restaurar (só no banco, `deleted_at = null`);
    entra com a tela de Clientes/arquivadas se for preciso.
  - Botões da linha da listagem viraram ícones (ver página, editar, enviar, arquivar, voltar a rascunho só em
    dev), todos em `app/(privado)/propostas/_components/proposal-actions.tsx` (agora recebe `publicToken`), com
    `title` e `aria-label`. Ícones novos em `app/(privado)/_components/icons.tsx`.
- Pronto na Etapa 7 (branch `feat/enviar-aprovar`):
  - `sendProposal(input)` em `app/(privado)/propostas/actions.ts`: `requireUser()` → Zod (`id` UUID) → UPDATE único
    `status = 'sent'`, `sentAt`, com `WHERE id AND status = 'draft' AND deletedAt IS NULL` (atômico). NÃO trava
    edição (decisão: só a proposta APROVADA fica travada; `updateProposal` recusa `approved`).
  - `revertToDraft(input)`: só dev (`throw` em produção); volta a `draft` e limpa `sentAt`, `approvedAt`,
    `paymentMethod`, `cardInstallments`.
  - `app/(privado)/propostas/_components/proposal-actions.tsx`: botão "Enviar" (rascunho) e "Voltar a rascunho"
    (só dev, por prop `showDevRevert` decidida no servidor), `useTransition` + erro inline.
  - `approveProposal(input)` em `app/(publico)/proposta/actions.ts` (pública, sem `requireUser()`): schema
    `lib/schemas/approve-proposal.ts` (`discriminatedUnion("paymentMethod")` com `strictObject`; `cardInstallments`
    1 a 3 só em `card` (decisão de 17/10/2026: antes era até 10x), proibido nos outros; `token` regex de 24 caracteres base64url). UPDATE único
    `WHERE publicToken AND status = 'sent' AND deletedAt IS NULL`, gravando `status`, `paymentMethod`,
    `cardInstallments` (null se não for cartão) e `approvedAt` juntos. Falha devolve mensagem genérica.
  - Página pública: `PaymentChoice` recebe `token`, `approved`, `approvedMethod` e `approvedInstallments`;
    chama a action, mostra confirmação e, ao abrir uma proposta aprovada, vem com a forma (e parcelas)
    pré-selecionada e travada. Testada manualmente.
  - Pendente: `createdAt` da listagem não mostra data de envio/aprovação.
- Decisões da Etapa 6:
  - Rascunho na página pública: com usuário logado abre (preview do dono); sem login, 404. `sent` e
    `approved` abrem para qualquer um com o token. "Não existe", `deletedAt` preenchido e "rascunho sem
    login" respondem igual (`notFound()`), para não revelar que o token existe.
  - `getOptionalUser()` em `lib/auth.ts` (devolve `null` sem usuário; desde a Etapa 8 lê a sessão real).
  - Item com desconto mostra o valor original riscado ao lado do valor final (igual aos bônus); o
    percentual/valor do desconto NÃO aparece em texto (decisão: informação demais). O detalhe expansível
    do item só existe com quantidade > 1 ("N × valor").
- Decisões da Etapa 5:
  - Itens no mesmo formulário de criação (opção A), em vez de tela de edição do rascunho. Editar proposta
    (rascunho ou enviada, já que não trava ao enviar) provavelmente vira necessário depois.
  - Desconto do item validado no Zod (conhece quantidade e preço); desconto geral validado na action
    (precisa do subtotal de todos os itens).
  - `toDiscount` lança erro em estado inconsistente em vez de devolver `null` (não cobrar errado em silêncio).
