# Arquitetura do Front-end — Sistema de Controle Financeiro SaaS
### Versão 2

---

## Stack tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, rotas aninhadas, middleware de auth, Server Components para SEO e performance |
| Linguagem | TypeScript | Tipagem estrita — essencial dado a complexidade do schema (ENUMs, nullables, FKs) |
| Estilização | Tailwind CSS + shadcn/ui | Velocidade de desenvolvimento + componentes acessíveis como base |
| Estado servidor | TanStack Query (React Query) | Cache, sincronização e refetch automático de dados do back-end |
| Estado cliente | Zustand | Estado global leve: filtros ativos, modal aberto, período selecionado |
| Formulários | React Hook Form + Zod | Validação client-side espelhando as regras de negócio do back-end |
| Gráficos | Recharts ou Tremor | Visualizações de fluxo de caixa, comparações mensais, categorias |
| HTTP | Axios ou fetch nativo com interceptors | Autenticação JWT, tratamento de erros centralizado |

---

## Estrutura de diretórios

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── registro/page.tsx
├── (dashboard)/
│   ├── layout.tsx               ← sidebar, header, proteção de rota
│   ├── page.tsx                 ← Dashboard principal
│   ├── lancamentos/
│   │   ├── page.tsx             ← Aba Entradas e Saídas
│   │   └── [id]/page.tsx        ← Detalhe de um lançamento
│   ├── categorias/page.tsx
│   └── contatos/page.tsx
├── api/                         ← Route handlers Next.js (se não usar back-end separado)
│   └── [...]/route.ts
components/
├── ui/                          ← Componentes base (shadcn/ui customizados)
├── lancamentos/
│   ├── TabelaOcorrencias.tsx
│   ├── FormLancamento.tsx
│   ├── CardOcorrencia.tsx
│   └── BotaoBaixar.tsx
├── dashboard/
│   ├── PainelResumo.tsx
│   ├── CardKPI.tsx
│   └── GraficoFluxo.tsx
├── categorias/
│   └── FormCategoria.tsx
└── shared/
    ├── FiltrosPeriodo.tsx
    ├── BadgeStatus.tsx
    └── ModalConfirmacao.tsx
hooks/
├── useLancamentos.ts
├── useOcorrencias.ts
├── useCategorias.ts
└── useContatos.ts
lib/
├── api.ts                       ← cliente HTTP configurado
├── utils.ts                     ← formatadores de moeda, data, status
└── validations.ts               ← schemas Zod
stores/
└── useUIStore.ts                ← Zustand: filtros, modal, período
```

---

## Páginas

### Auth — `/login` e `/registro`

Fluxo simples de autenticação. O middleware do Next.js protege todas as rotas do grupo `(dashboard)` — redireciona para `/login` se não houver sessão válida.

**Campos no login:** email + senha  
**Campos no registro:** nome + email + senha + confirmação  
**Pós-login:** redirect para `/` (Dashboard)

---

### Dashboard — `/`

Visão consolidada do momento financeiro do usuário. **Não é uma tabela** — é uma camada de inteligência sobre os dados.

**Hierarquia visual obrigatória — 3 zonas em ordem de urgência:**

#### Zona 1 — Emergência (topo, fundo vermelho, sempre visível)
Exibida apenas quando existem ocorrências atrasadas. Se não houver atrasos, esta zona não aparece.

| Elemento | Detalhe |
|---|---|
| Título | "N contas em atraso" com indicador pulsante |
| Lista de atrasadas | Nome · "Venceu há N dias" · Valor · Botão "Baixar" direto |
| Total em atraso | Soma de todas as atrasadas |
| Query | `GET /ocorrencias?status=PENDENTE&vencidas=true` |

O botão "Baixar" dentro desta zona abre o modal de baixa sem precisar navegar para Entradas e Saídas. O usuário resolve o problema de onde está.

#### Zona 2 — Situação atual (KPIs + gráficos)
Informação de contexto — não exige ação imediata.

| Bloco | Dados necessários | Query sugerida |
|---|---|---|
| Saldo do mês | Soma entradas − saídas (competência = mês corrente) | `GET /resumo?mes=YYYY-MM` |
| Entradas | Total entradas do mês com delta vs. mês anterior | `GET /resumo?mes=YYYY-MM` |
| Saídas | Total saídas do mês com delta vs. mês anterior | `GET /resumo?mes=YYYY-MM` |
| Gráfico de fluxo | Entradas e saídas por `data_competencia` (últimos 6 meses) | `GET /resumo/mensal?ultimos=6` |
| Top categorias | Agrupamento por `categoria_id`, soma de valor | `GET /resumo/categorias?mes=YYYY-MM` |

#### Zona 3 — Horizonte (peso visual menor, sem destaque de cor)
Informativo. Itens que ainda não venceram — nenhuma ação urgente necessária.

| Bloco | Dados necessários | Query sugerida |
|---|---|---|
| Próximos vencimentos | Ocorrências PENDENTE nos próximos 7 dias | `GET /ocorrencias?proximos_dias=7` |

**Regra importante:** o status ATRASADA não vem do banco — o front-end calcula: `status === 'PENDENTE' && data_vencimento < hoje`.

---

### Entradas e Saídas — `/lancamentos`

Ambiente principal de operação. Composto por duas sub-visões navegáveis:

#### Sub-visão 1: Ocorrências do mês (padrão)

Exibe as `OCORRENCIAS` do mês selecionado, agrupadas por competência. O usuário age diretamente sobre cada ocorrência.

**Filtros disponíveis:**
- Período (mês/ano) — default: mês atual
- Natureza (ENTRADA / SAIDA / todas)
- Status (PENDENTE / BAIXADA / ATRASADA* / todas)
- Categoria (multi-select)
- Contato (select)
- Busca por nome do lançamento

*ATRASADA é filtro client-side: `status = PENDENTE AND data_vencimento < hoje`

**Colunas da tabela:**

| Coluna | Campo | Obs |
|---|---|---|
| Nome | `lancamentos.nome` | Com ícone da categoria |
| Valor | `valor_editado ?? valor` | Destaque se editado manualmente |
| Vencimento | `data_vencimento` | Badge de cor por status |
| Status | Calculado | PENDENTE / ATRASADA / BAIXADA |
| Categoria | `categorias.nome` + cor | Pill colorida |
| Contato | `contatos.nome` | Opcional — "-" se null |
| Parcela | `numero_parcela / total_parcelas` | Só para tipo PARCELA |
| Ações | — | Baixar · Editar · Cancelar · Mais |

**Ações inline por ocorrência:**
- **Baixar:** abre modal com campo de `data_baixa` (default: hoje) + `observacao` opcional → PUT `/ocorrencias/:id/baixar`
- **Editar valor:** inline edit no campo valor → salva em `valor_editado`
- **Cancelar:** modal de confirmação com texto explicativo → PUT `/ocorrencias/:id/cancelar`
- **Ver detalhes:** abre sheet lateral com histórico completo da ocorrência

**Rodapé da tabela (sempre visível):**

```
Entradas: R$ X.XXX,XX   |   Saídas: R$ X.XXX,XX   |   Saldo: R$ X.XXX,XX
```

#### Sub-visão 2: Lançamentos (contratos)

Gerencia os `LANCAMENTOS` — as regras de recorrência, não as parcelas em si.

**Colunas:** Nome · Tipo · Categoria · Valor base · Data início · Data fim · Status (ativo/arquivado) · Ações  
**Ações:** Editar · Arquivar · Ver ocorrências geradas

---

### Edição de lançamento — regra de escopo (obrigatória)

Toda edição de um lançamento recorrente (`FIXA` ou `PARCELA`) deve obrigatoriamente passar por uma decisão do usuário sobre o escopo da alteração. Esta decisão é uma **regra de produto** — não pode ficar implícita ou a cargo do desenvolvedor.

**Quando disparar o modal de escopo:**
- Qualquer alteração em lançamento do tipo `FIXA` ou `PARCELA`
- Campos que disparam o modal: valor, data de início, categoria, contato, nome
- Lançamentos `ESPORADICA` não precisam do modal (têm apenas 1 ocorrência)

**As 4 opções de escopo:**

| Opção | O que altera | Afeta histórico? |
|---|---|---|
| Apenas este mês | Somente a ocorrência atual | Não |
| Este e os próximos | Ocorrência atual + todas as futuras | Não |
| Este e os anteriores | Ocorrência atual + todas as passadas | Sim — exibe aviso |
| Todos os lançamentos | Todas as ocorrências sem exceção | Sim — exibe aviso |

**Aviso obrigatório para escopos que afetam o histórico:**
Quando o usuário selecionar "Este e os anteriores" ou "Todos os lançamentos", exibir:
> "Atenção: esta ação irá alterar ocorrências já baixadas (pagas). O valor registrado nos pagamentos passados será atualizado."

**O modal deve mostrar o resumo da alteração** antes da confirmação:
```
Valor:  R$ 1.500,00  →  R$ 1.650,00
```

**Implementação no back-end:**
O endpoint de edição deve receber o parâmetro `escopo` junto com os dados alterados:
```
PUT /lancamentos/:id
{ valor_base: 1650.00, escopo: "ESTE_E_PROXIMOS" }
```
Valores válidos: `APENAS_ESTE` · `ESTE_E_PROXIMOS` · `ESTE_E_ANTERIORES` · `TODOS`

---

### Categorias — `/categorias`

**Listagem:** cards com cor da categoria (hex visual), ícone, nome, quantidade de lançamentos vinculados, status ativo/inativo.

**Formulário (criar/editar):**
- Nome (obrigatório)
- Cor: color picker que garante saída no formato `#RRGGBB` — validação `^#[0-9A-Fa-f]{6}$` no Zod, nunca aceitar string livre
- Ícone: picker visual buscando slugs da biblioteca Lucide
- Ordem: drag-and-drop para reordenar

**Desativar:** não deleta — seta `ativo = false`. Lançamentos vinculados são preservados. Exibe aviso: "Esta categoria tem X lançamentos ativos. Ela será ocultada da lista mas o histórico será mantido."

---

### Contatos — `/contatos`

A página de Contatos não é um cadastro — é uma visão de **relacionamento financeiro**. O banco tem dados suficientes para mostrar quanto você deve para cada credor, quanto já recebeu de cada pagador e o progresso de cada financiamento.

**Layout:** duas colunas — lista de contatos à esquerda, painel de detalhe à direita (master-detail).

#### Coluna esquerda — lista
Cada item exibe: avatar com iniciais · nome · papel (Credor / Pagador) · quantidade de lançamentos · valor mensal total.

A cor do avatar segue a natureza predominante: vermelho para credores, verde para pagadores.

#### Coluna direita — painel de detalhe

Ao selecionar um contato, o painel mostra:

**KPIs do relacionamento** (variam por papel):

| Papel | KPI 1 | KPI 2 | KPI 3 |
|---|---|---|---|
| Credor | Total já pago | Ainda deve | Em dia? |
| Pagador | Total já recebido | Próximo recebimento | Status |

**Barra de progresso** (apenas para lançamentos `PARCELA`):
Exibe `N de X parcelas pagas` com barra visual proporcional. Essencial para financiamentos.

**Histórico de lançamentos:**
Todas as ocorrências vinculadas a este contato, ordenadas por data decrescente. Colunas: nome do lançamento · identificador de parcela · valor · data · status (badge colorido).

**Endpoints necessários:**
```
GET /contatos/:id/resumo     → KPIs calculados
GET /contatos/:id/ocorrencias → histórico paginado
```

---

## Gerenciamento de estado

### TanStack Query — dados do servidor

Toda leitura de dados do back-end passa por React Query. Isso garante:
- Cache automático (evita chamadas duplicadas)
- Revalidação em foco de janela
- Optimistic updates para ações de baixa (UX fluída)
- Loading/error states consistentes

```ts
// Exemplo de hook
export function useOcorrencias(filtros: FiltrosOcorrencia) {
  return useQuery({
    queryKey: ['ocorrencias', filtros],
    queryFn: () => api.get('/ocorrencias', { params: filtros }),
    staleTime: 1000 * 60, // 1 min
  });
}
```

### Zustand — estado de UI

Estado efêmero que não precisa persistir no servidor:

```ts
interface UIStore {
  mesAtivo: string;            // "2026-04" — mês selecionado no filtro
  filtrosAtivos: Filtros;      // filtros da tabela de ocorrências
  modalAberto: ModalTipo | null;
  setMesAtivo: (mes: string) => void;
  setFiltros: (f: Partial<Filtros>) => void;
  abrirModal: (tipo: ModalTipo) => void;
  fecharModal: () => void;
}
```

---

## Validações (Zod) — espelhando regras de negócio

As validações do front-end devem espelhar as regras do banco. Exemplos críticos:

```ts
const schemaLancamento = z.object({
  nome: z.string().min(1),
  natureza: z.enum(['ENTRADA', 'SAIDA']),
  tipo: z.enum(['FIXA', 'ESPORADICA', 'PARCELA']),
  total_parcelas: z.number().int().positive().optional(),
  valor_base: z.number().positive(),
  data_inicio: z.string().date(),
  data_fim: z.string().date().optional(),
  categoria_id: z.string().uuid(),
  contato_id: z.string().uuid().optional(),
}).refine(data => {
  // PARCELA exige total_parcelas, não usa data_fim
  if (data.tipo === 'PARCELA') return !!data.total_parcelas && !data.data_fim;
  // FIXA pode ter data_fim, nunca total_parcelas
  if (data.tipo === 'FIXA') return !data.total_parcelas;
  return true;
}, { message: "Combinação de tipo e campos inválida" });

const schemaCor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida — use formato #RRGGBB");
```

---

## Cálculos client-side

O back-end serve dados brutos. O front-end é responsável por:

### Status de atraso
```ts
function calcularStatus(ocorrencia: Ocorrencia): StatusExibicao {
  if (ocorrencia.status === 'BAIXADA') return 'BAIXADA';
  const hoje = new Date().toISOString().split('T')[0];
  if (ocorrencia.data_vencimento < hoje) return 'ATRASADA';
  return 'PENDENTE';
}
```

### Valor a exibir
```ts
const valorExibido = ocorrencia.valor_editado ?? ocorrencia.valor;
```

### Filtro de ATRASADA (client-side)
```ts
const atrasadas = ocorrencias.filter(o =>
  o.status === 'PENDENTE' &&
  o.data_vencimento < hoje &&
  !o.cancelada
);
```

### Papel do contato por contexto
```ts
const papelContato = lancamento.natureza === 'SAIDA' ? 'Credor' : 'Pagador';
```

---

## Contrato com o back-end

O back-end deve entregar respostas **já preparadas** para o front. Endpoints mínimos:

| Endpoint | Método | Descrição |
|---|---|---|
| `/ocorrencias` | GET | Lista com filtros: `mes`, `natureza`, `status`, `categoria_id`, `contato_id` |
| `/ocorrencias/:id/baixar` | PUT | Registra `data_baixa`, `baixado_por`, `baixado_em` |
| `/ocorrencias/:id/cancelar` | PUT | Seta `cancelada = true`, `cancelada_por`, `cancelada_em` |
| `/lancamentos` | GET / POST | Lista e criação |
| `/lancamentos/:id` | PUT / DELETE | Edição e arquivamento |
| `/categorias` | GET / POST / PUT | Gestão de categorias |
| `/contatos` | GET / POST / PUT | Gestão de contatos |
| `/resumo` | GET | Totais do mês para Dashboard |
| `/resumo/mensal` | GET | Histórico de N meses para gráfico |
| `/resumo/categorias` | GET | Agrupamento por categoria do mês |

**Regras de contrato:**
- Datas sempre em ISO 8601 (`YYYY-MM-DD`)
- Valores sempre em `DECIMAL` — nunca formatar no back-end, o front formata para exibição
- O campo `status` retorna sempre `PENDENTE` ou `BAIXADA` — nunca `ATRASADA` (calculado no front)
- Ocorrências com `cancelada = true` **nunca** devem aparecer nos endpoints de listagem padrão (filtro implícito no back-end)

---

## Design system

### Paleta de cores semântica

```css
--cor-entrada:   #16a34a;   /* verde — natureza ENTRADA */
--cor-saida:     #dc2626;   /* vermelho — natureza SAIDA */
--cor-pendente:  #d97706;   /* âmbar — status PENDENTE */
--cor-atrasada:  #dc2626;   /* vermelho — status ATRASADA */
--cor-baixada:   #6b7280;   /* cinza — status BAIXADA */
--cor-cancelada: #9ca3af;   /* cinza claro — cancelada */
```

### Componente BadgeStatus

```tsx
const cores = {
  PENDENTE:  'bg-amber-100  text-amber-800',
  ATRASADA:  'bg-red-100    text-red-800',
  BAIXADA:   'bg-gray-100   text-gray-600',
  CANCELADA: 'bg-gray-50    text-gray-400 line-through',
};
```

### Formatadores

```ts
// Moeda
const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// Data
const formatarData = (data: string) =>
  new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

// Parcela
const formatarParcela = (atual: number, total: number | null) =>
  total ? `${atual}/${total}` : null;
```

---

## Regras de UX críticas

1. **Período sempre visível:** o mês/competência selecionado deve estar fixo no topo da tela durante a navegação — nunca some do viewport.

2. **Saldo sempre presente:** na aba Entradas e Saídas, o rodapé com totais deve ser `sticky bottom` — visível mesmo com lista longa.

3. **Feedback imediato:** toda ação (baixar, cancelar, criar) deve ter:
   - Estado de loading no botão (não desabilitar sem feedback visual)
   - Toast de sucesso ou erro após resolução
   - Atualização otimista da UI antes da confirmação do servidor

4. **ATRASADA em destaque:** ocorrências atrasadas devem ter destaque visual claro — linha com fundo levemente vermelho, badge `ATRASADA` prominente, ícone de alerta.

5. **Valor editado sinalizado:** quando `valor_editado IS NOT NULL`, exibir o valor com ícone de "editado manualmente" e tooltip com o valor original.

6. **Cancelada ≠ Baixada:** a UI deve tornar clara a distinção — cancelada significa "não aconteceu", baixada significa "foi pago/recebido". Ícones e cores diferentes obrigatórios.

7. **Tipos de lançamento no formulário:** o formulário de criação deve adaptar seus campos dinamicamente:
   - `FIXA` → mostra campo `data_fim` (opcional), oculta `total_parcelas`
   - `PARCELA` → mostra `total_parcelas` (obrigatório), oculta `data_fim`
   - `ESPORADICA` → oculta ambos

8. **Contato opcional:** o campo `contato_id` deve ser claramente marcado como opcional no formulário, com placeholder explicativo: "Ex: Nubank, Fornecedor X (opcional)".

---

## Histórico de alterações

### v1 (inicial)
- Definição da stack tecnológica (Next.js 14 + TypeScript + Tailwind + React Query + Zustand)
- Estrutura de diretórios
- Mapeamento de todas as páginas com campos e ações
- Contrato mínimo com o back-end
- Design system semântico alinhado ao schema v7
- Regras de UX críticas

### v2
| O que mudou | Motivo |
|---|---|
| Dashboard reorganizado em 3 zonas de urgência | Atrasos e próximos vencimentos tinham o mesmo peso visual — são informações de natureza completamente diferente |
| Zona de Emergência adicionada ao Dashboard | Contas atrasadas exigem ação imediata — merecem destaque próprio com botão de baixa direto, sem navegação extra |
| Regra de escopo de edição definida para lançamentos recorrentes | Sem esta regra o dev tomaria decisões arbitrárias. As 4 opções (apenas este, este e próximos, este e anteriores, todos) são decisão de produto, não de implementação |
| Parâmetro `escopo` adicionado ao contrato do back-end (`PUT /lancamentos/:id`) | Consequência direta da regra de escopo |
| Página de Contatos redesenhada como master-detail com relacionamento financeiro | A versão anterior era um cadastro simples. O banco já tem dados para mostrar total pago, total devido, progresso de parcelas e histórico completo por contato |
| Endpoints `GET /contatos/:id/resumo` e `GET /contatos/:id/ocorrencias` adicionados ao contrato | Necessários para alimentar o novo painel de detalhe de contatos |
