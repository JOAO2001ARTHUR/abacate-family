# Estrutura do Banco de Dados — Sistema de Controle Financeiro
### Versão 7

---

## Tabela: USUARIOS
> Tabela base de autenticação. Referenciada por todas as outras.

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID / INT | PK |
| nome | VARCHAR | Nome do usuário |
| email | VARCHAR | Único |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | Atualizado automaticamente a cada modificação do registro |

---

## Tabela: CATEGORIAS
> O usuário cria suas próprias categorias. No cadastro de um lançamento, ele escolhe uma existente ou cria uma nova.

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID / INT | PK |
| user_id | UUID / INT | FK → USUARIOS |
| nome | VARCHAR | Ex: "Alimentação", "Salário", "Aluguel" |
| cor | VARCHAR(7) | Código hex da cor no formato `#RRGGBB`. Ex: `#F97316`. **Validação obrigatória na camada de aplicação** — aceitar apenas strings que correspondam ao padrão `^#[0-9A-Fa-f]{6}$`. Nunca salvar valores como `"vermelho"` ou strings inválidas. |
| icone | VARCHAR | **Nullable.** Identificador do ícone escolhido pelo usuário. Ex: `"fork-knife"`, `"car"`, `"home"`. O valor armazenado é o identificador do ícone na biblioteca usada pela interface (ex: Lucide, Material Icons). Não armazenar o SVG — apenas o nome/slug. |
| ordem | INT | Posição de exibição definida pelo usuário. Permite ordenação customizada na listagem de categorias. |
| ativo | BOOLEAN | `true` por padrão. `false` quando o usuário desativa a categoria. Preserva histórico dos lançamentos vinculados sem deletar. |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | Atualizado automaticamente a cada modificação do registro |

---

## Tabela: CONTATOS
> Entidade neutra que representa quem paga ou recebe em um lançamento. O papel do contato (credor ou pagador) é determinado pela `natureza` do lançamento, não pelo contato em si — pois o mesmo contato pode aparecer nos dois contextos.

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID / INT | PK |
| user_id | UUID / INT | FK → USUARIOS |
| nome | VARCHAR | Ex: "Nubank", "Salário empresa X", "Fornecedor Y" |
| ativo | BOOLEAN | `true` por padrão. `false` quando o usuário desativa o contato. Preserva histórico dos lançamentos vinculados sem deletar. |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | Atualizado automaticamente a cada modificação do registro |

---

## Tabela: LANCAMENTOS
> O "contrato" do lançamento — define as regras de recorrência. Cada entrada ou saída começa aqui.

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID / INT | PK |
| user_id | UUID / INT | FK → USUARIOS |
| categoria_id | UUID / INT | FK → CATEGORIAS |
| contato_id | UUID / INT | **Nullable.** FK → CONTATOS. Opcional — nem todo lançamento tem um contato identificável (ex: gorjeta, estacionamento, rendimento de investimento). |
| nome | VARCHAR | Nome da dívida ou ganho (ex: "Conta de luz", "Salário") |
| descricao | TEXT | **Nullable.** Campo livre para observações no nível do lançamento. Ex: "financiamento com cláusula de multa por antecipação", "salário com reajuste previsto para julho". Diferente de `observacao` em OCORRENCIAS, que é por parcela — este é sobre o lançamento como um todo. |
| natureza | ENUM | `ENTRADA` ou `SAIDA` |
| tipo | ENUM | `FIXA`, `ESPORADICA` ou `PARCELA` |
| total_parcelas | INT | **Apenas para tipo `PARCELA`.** Define a quantidade de ocorrências a gerar. Nulo nos outros tipos. |
| valor_base | DECIMAL(10,2) | Valor de referência do lançamento |
| data_inicio | DATE | A partir de quando o lançamento passa a valer |
| data_fim | DATE | **Nullable. Exclusivo para tipo `FIXA`.** Data em que o lançamento encerra automaticamente. Para tipo `PARCELA`, o fim é determinado por `total_parcelas` — os dois não coexistem. Quando `data_fim` é atingida, o sistema arquiva o lançamento sem intervenção manual. |
| ativo | BOOLEAN | `true` por padrão. `false` quando arquivado manualmente ou quando `data_fim` é atingida. Preserva histórico sem deletar o registro. |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | Atualizado automaticamente a cada modificação do registro |

---

## Tabela: OCORRENCIAS
> Cada parcela ou mês gerado a partir de um lançamento. É aqui que fica o status, as datas e os valores de cada período individual.

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID / INT | PK |
| lancamento_id | UUID / INT | FK → LANCAMENTOS |
| numero_parcela | INT | Ex: 1, 2, 3... — útil para tipo `PARCELA`. Pode ser nulo para `FIXA` e `ESPORADICA`. |
| data_vencimento | DATE | Data em que aquela parcela/mês deve ser paga ou recebida |
| data_competencia | DATE | **Calculado automaticamente pela aplicação** a partir de `data_vencimento` no momento da geração da ocorrência. Nunca informado pelo usuário. Regra: primeiro dia do mês de `data_vencimento` (ex: vencimento 05/04 → competência 01/04). Usado para relatórios mensais corretos. |
| valor | DECIMAL(10,2) | Valor herdado do `valor_base` do lançamento pai no momento da geração |
| valor_editado | DECIMAL(10,2) | **Nullable.** Preenchido somente se o usuário alterar o valor desta ocorrência manualmente. Se nulo, o valor vigente é `valor`. A presença de valor aqui já indica edição manual. |
| status | ENUM | `PENDENTE` ou `BAIXADA`. **Não existe `ATRASADA` no banco** — o atraso é calculado pela aplicação em tempo real (ver regra abaixo). |
| cancelada | BOOLEAN | `false` por padrão. `true` quando uma ocorrência específica é cancelada sem ser baixada nem deletada. Ex: "esse mês não vai cobrar". Ocorrências canceladas são ignoradas nos relatórios. |
| cancelada_por | UUID / INT | **Nullable.** FK → USUARIOS — registra qual usuário realizou o cancelamento. |
| cancelada_em | TIMESTAMP | **Nullable.** Momento exato em que o cancelamento foi registrado no sistema. |
| data_baixa | DATE | Nulo enquanto não baixado. Preenchido ao registrar o pagamento ou recebimento. |
| baixado_por | UUID / INT | **Nullable.** FK → USUARIOS — registra qual usuário realizou a baixa. |
| baixado_em | TIMESTAMP | **Nullable.** Momento exato em que a baixa foi registrada no sistema. Diferente de `data_baixa`, que é a data informada pelo usuário. |
| observacao | TEXT | **Nullable.** Campo livre para o usuário anotar por parcela: "paguei parcial", "aguardando compensação", "negociado com desconto", etc. Diferente de `descricao` em LANCAMENTOS, que é sobre o lançamento como um todo. |
| criado_em | TIMESTAMP | |
| atualizado_em | TIMESTAMP | Atualizado automaticamente a cada modificação do registro |

---

## Regras de negócio resumidas

| Tipo | Gera quantas ocorrências? | `data_fim` | `total_parcelas` |
|---|---|---|---|
| `ESPORADICA` | 1 — somente na data informada | Não se aplica | Não se aplica |
| `PARCELA` | N — definido por `total_parcelas` | **Não usar** | Obrigatório |
| `FIXA` | Contínuas a partir de `data_inicio` | Opcional | **Não usar** |

---

### Como funciona o status ATRASADA

**`ATRASADA` não é armazenado no banco.** O banco guarda apenas `PENDENTE` e `BAIXADA`. O status de atraso é calculado pela aplicação no momento da leitura, sem nenhum job ou atualização periódica:

```
SE status = 'PENDENTE' E data_vencimento < HOJE
  → exibir como ATRASADA na interface

SE status = 'PENDENTE' E data_vencimento >= HOJE
  → exibir como PENDENTE

SE status = 'BAIXADA'
  → exibir como BAIXADA
```

Para filtrar ocorrências atrasadas no banco, a query correta é:
```sql
WHERE status = 'PENDENTE'
  AND data_vencimento < CURRENT_DATE
  AND cancelada = false
```

**Por que assim?** O atraso é uma função do tempo — se o banco armazenasse `ATRASADA`, precisaria de um processo rodando toda noite para atualizar os registros. Se esse processo falhasse ou atrasasse, o dado ficaria inconsistente. Calcular na leitura garante que o status sempre reflete a realidade do momento.

---

### Valor a exibir por ocorrência

```
valor_exibido = valor_editado SE valor_editado IS NOT NULL
              SENÃO valor
```

A presença de `valor_editado` já indica que houve edição manual — não é necessário um campo boolean separado dizendo a mesma coisa.

---

### Como data_competencia é definida

**`data_competencia` é sempre calculada automaticamente pela aplicação** no momento em que a ocorrência é gerada. O usuário nunca informa esse campo. A regra padrão é:

```
data_competencia = primeiro dia do mês de data_vencimento
Ex: data_vencimento = 05/04/2026 → data_competencia = 01/04/2026
Ex: data_vencimento = 28/03/2026 → data_competencia = 01/03/2026
```

---

### Validação do campo cor em CATEGORIAS

**A camada de aplicação deve rejeitar qualquer valor que não siga o padrão `#RRGGBB`.** A validação deve ocorrer antes de salvar, nunca confiar no dado bruto do banco.

```
Formato aceito:  #F97316  (# seguido de exatamente 6 caracteres hex)
Padrão regex:    ^#[0-9A-Fa-f]{6}$
Exemplos válidos:   #F97316, #3B82F6, #10B981, #EF4444
Exemplos inválidos: vermelho, #FFF, #GGGGGG, F97316 (sem #), string vazia
```

---

### Filtro de relatório mensal
```sql
WHERE data_competencia >= '2026-04-01'
  AND data_competencia <  '2026-05-01'
  AND cancelada = false
```

---

### Arquivamento de lançamento
```
Manual:     usuário define ativo = false
Automático: sistema define ativo = false quando data_fim é atingida (tipo FIXA)
Em ambos:   histórico preservado, lançamento some da listagem principal
```

### Cancelamento de ocorrência individual
```
cancelada = true  → ignorada em relatórios e totalizadores
cancelada = false → comportamento normal
cancelada_por e cancelada_em → rastreiam quem e quando cancelou
Diferente de BAIXADA — não representa pagamento, representa ausência de cobrança.
```

### Papel do contato por contexto
```
natureza = SAIDA   → contato é credor  (para quem se paga)
natureza = ENTRADA → contato é pagador (de quem se recebe)
O contato em si é neutro — o papel vem do lançamento.
contato_id nullable — lançamentos sem contato identificável são permitidos.
```

### Diferença entre descricao e observacao
```
LANCAMENTOS.descricao  → sobre o lançamento como um todo
                          Ex: "financiamento com multa por antecipação"
OCORRENCIAS.observacao → sobre uma parcela específica
                          Ex: "esse mês paguei com desconto"
```

---

## Relacionamentos

```
USUARIOS
  └── CATEGORIAS           (1 usuário → N categorias)
  └── CONTATOS             (1 usuário → N contatos)
  └── LANCAMENTOS          (1 usuário → N lançamentos)
        └── OCORRENCIAS      (1 lançamento → N ocorrências)
CATEGORIAS
  └── referenciada por LANCAMENTOS
CONTATOS
  └── referenciada por LANCAMENTOS (nullable)
USUARIOS
  └── referenciada por OCORRENCIAS (baixado_por, cancelada_por — ambos nullable)
```