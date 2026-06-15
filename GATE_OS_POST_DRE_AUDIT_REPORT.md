# GATE OS - Auditoria pos-DRE

Data: 2026-06-15

## Escopo auditado

- Build completo do Next.js.
- Lint completo do projeto.
- Rotas renderizadas no build.
- Consultas Supabase usadas por modulos operacionais.
- Tabelas/views Supabase pelo script `scripts/audit-supabase-structure.mjs`.
- Pontos com `featureInPreparation`.
- Pontos com nome ou dependencia legado/mock.
- Exports PDF/Excel usados pelos modulos.
- DRE operacional 2026 apos inclusao do baseline.

## Critico

Nenhum item critico encontrado no codigo apos a correcao da DRE.

Validacoes:

- `npm run lint` passou.
- `npm run build` passou.
- O build gerou todas as rotas esperadas:
  - `/dashboard`
  - `/clientes`
  - `/contratos`
  - `/financeiro`
  - `/dre`
  - `/documentos`
  - `/equipamentos`
  - `/juridico`
  - `/lancamentos`
  - `/manutencoes`
  - `/patrimonio`
  - `/relatorios`
  - `/socios`

## Alto

### DRE 2026 sem valores-base da planilha

Status: corrigido.

Impacto: a DRE operacional funcionava com categorias e lancamentos reais, mas nao exibia o baseline da planilha 2026, deixando a visao inicial incompleta.

Correcao:

- Criado `supabase/gate-os-dre-2026-operational-baseline-values.sql`.
- Criada leitura de `dre_operational_baseline_values`.
- Valores-base passam a somar com lancamentos reais.
- Totais continuam calculados pela interface.

### Storage buckets esperados nao encontrados/listaveis

Status: nao corrigido no codigo.

Impacto: uploads reais de documentos/contratos/juridico podem falhar se os buckets nao existirem no Supabase Storage.

Evidencia:

- Auditoria estrutural retornou `found: []` para os buckets esperados:
  - `gate-documents`
  - `gate-contracts`
  - `gate-legal`

Risco: alto para operacao de documentos, baixo para DRE.

Acao recomendada:

- Criar/validar os buckets no Supabase Storage com as policies apropriadas para usuarios autenticados.

## Medio

### Avisos de dimensao de graficos no build

Status: conhecido, nao bloqueante.

Impacto: durante prerender estatico, componentes de grafico emitiram aviso de largura/altura `-1`. O build terminou com sucesso.

Acao recomendada:

- Revisar containers dos graficos e definir `minHeight`/`minWidth` onde necessario.

### Botoes explicitamente marcados como em preparacao

Status: documentado.

Impacto: algumas acoes mostram aviso em vez de executar fluxo completo. Elas nao simulam sucesso.

Exemplos:

- Open Finance/conexao bancaria.
- Importacao OFX/CSV completa.
- Conciliacao bancaria automatica.
- Algumas acoes juridicas avancadas.
- Agendamento/envio de relatorios.
- Reabertura de mes da DRE.

Acao recomendada:

- Priorizar por modulo antes de transformar em fluxo persistente.

### Nome legado `MockCreateDialog`

Status: documentado.

Impacto: o nome do componente e legado, mas nos pontos auditados ele recebe `onSave` e persiste via funcoes reais de dados.

Acao recomendada:

- Renomear futuramente para `CreateRecordDialog` para reduzir ambiguidade.

## Baixo

### Logs de erro em console

Status: esperado para diagnostico.

Impacto: alguns modulos usam `console.error`/`console.warn` antes de exibir toast ou erro ao usuario.

Acao recomendada:

- Manter durante estabilizacao ou padronizar logger depois.

### Fallbacks genericos de leitura Supabase

Status: conhecido.

Impacto: helpers genericos podem retornar arrays vazios quando Supabase nao esta configurado. Modulos criticos da DRE ja usam consultas com erro explicito para categorias, template, baseline e historico.

Acao recomendada:

- Migrar gradualmente modulos operacionais para erro explicito quando a ausencia de dados puder parecer sucesso.

## Validacoes finais executadas

- Carga da DRE 2026 validada aritmeticamente contra os prints.
- `financial_entries` continua como fonte de lancamentos reais.
- `dre_category_id` continua vinculando lancamentos a linhas operacionais.
- Historico `2022`-`2025` nao foi alterado.
- `npm run lint`
- `npm run build`
- `node scripts/audit-supabase-structure.mjs`
