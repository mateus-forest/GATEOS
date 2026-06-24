# GATE OS - Correcao da extracao do contrato ATIBAIA

## Escopo

Correcao pontual do parser de contratos do COS para estabilizar a extracao do contrato ATIBAIA.

Nao foram alterados Auth, RLS, banco, Supabase, DRE, rotas, UI, prompts, acoes, edicoes em massa ou qualquer fluxo de gravacao.

## Fixture local

Arquivo criado:

- `scripts/fixtures/cos-contract-atibaia.txt`

Validador criado:

- `scripts/validate-cos-atibaia-contract.cjs`

O validador executa a extracao real do parser local e compara campo a campo contra a saida esperada. Se qualquer campo obrigatorio falhar, o script encerra com erro.

## Saida esperada

```json
{
  "lessorName": "Gamer Tech Importação Ltda",
  "lessorDocument": "47.579.509/0001-02",
  "lesseeName": "BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA",
  "lesseeDocument": "60.961.002/0001-79",
  "guarantorName": "Wembley Gomes Costa",
  "guarantorDocument": "815.508.393-49",
  "termMonths": 36,
  "monthlyValue": 3697.33,
  "depositValue": 3697.33,
  "monthlyDueDay": 15,
  "signatureDate": "27/05/2025",
  "calculatedEndDate": "27/05/2028",
  "equipment": [
    { "quantity": 8, "description": "AMD Ryzen 5, RTX 3060, 16GB RAM, SSD 1TB, 650W" },
    { "quantity": 4, "description": "AMD Ryzen 5, RTX 3050, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { "quantity": 1, "description": "AMD Ryzen 5, RTX 3060, 8GB RAM, SSD 1TB, 750W" },
    { "quantity": 1, "description": "AMD Ryzen 5, RTX 2060, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { "quantity": 10, "description": "Monitor Gamer 165Hz 23.8”" }
  ]
}
```

## Saida real antes

Comando:

```bash
node scripts\validate-cos-atibaia-contract.cjs --git-head
```

Resultado: falhou.

Principais divergencias:

- Locadora extraida como `BELI GAME`, esperado `Gamer Tech Importação Ltda`.
- Locataria extraida como `NTO, INOVACOES E SERVICOS LTDA`, esperado `BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA`.
- Fiador extraido como `Nome: Wembley Gomes Costa`, esperado `Wembley Gomes Costa`.
- Equipamentos extraidos: `0`, esperado `5`.
- Todos os itens de equipamentos obrigatorios falharam na extracao anterior.

Campos que ja batiam antes:

- CNPJ locadora.
- CNPJ locataria.
- CPF fiador.
- Prazo de 36 meses.
- Valor mensal de R$ 3.697,33.
- Caucao de R$ 3.697,33.
- Vencimento dia 15.
- Data de assinatura 27/05/2025.
- Data final calculada 27/05/2028.

## Correcoes aplicadas

- Locadora passa a ser extraida do bloco `LOCADORA` ate antes de `LOCATARIA`.
- Locataria passa a ser extraida do bloco `LOCATARIA` ate antes de `FIADOR`.
- Fiador passa a ser extraido do bloco `FIADOR` ate antes de `CLAUSULA 1`.
- Equipamentos passam a ser extraidos somente da `CLAUSULA 1`.
- Prazo passa a ser extraido somente da `CLAUSULA 2`.
- Valor mensal, caucao e vencimento passam a ser extraidos somente da `CLAUSULA 3`.
- Nomes rotulados como `Razao Social` e `Nome` sao limpos antes de preencher as entidades.
- Linhas de tabela de equipamentos no formato `quantidade | descricao` passam a ser interpretadas corretamente.

## Saida real depois

Comando:

```bash
node scripts\validate-cos-atibaia-contract.cjs
```

Resultado: sucesso.

```json
{
  "lessorName": "Gamer Tech Importação Ltda",
  "lessorDocument": "47.579.509/0001-02",
  "lesseeName": "BELI GAMES, ENTRETENIMENTO, INOVACOES E SERVICOS LTDA",
  "lesseeDocument": "60.961.002/0001-79",
  "guarantorName": "Wembley Gomes Costa",
  "guarantorDocument": "815.508.393-49",
  "termMonths": 36,
  "monthlyValue": 3697.33,
  "depositValue": 3697.33,
  "monthlyDueDay": 15,
  "signatureDate": "27/05/2025",
  "calculatedEndDate": "27/05/2028",
  "equipment": [
    { "quantity": 8, "description": "AMD Ryzen 5, RTX 3060, 16GB RAM, SSD 1TB, 650W" },
    { "quantity": 4, "description": "AMD Ryzen 5, RTX 3050, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { "quantity": 1, "description": "AMD Ryzen 5, RTX 3060, 8GB RAM, SSD 1TB, 750W" },
    { "quantity": 1, "description": "AMD Ryzen 5, RTX 2060, 16GB RAM, SSD 480GB, HD 1TB, 650W" },
    { "quantity": 10, "description": "Monitor Gamer 165Hz 23.8”" }
  ]
}
```

Falhas depois: `[]`.

## Campos validados

- Locadora.
- CNPJ da locadora.
- Locataria/cliente.
- CNPJ da locataria.
- Fiador.
- CPF do fiador.
- Prazo.
- Valor mensal.
- Caucao.
- Dia de vencimento.
- Data de assinatura.
- Data final calculada.
- Cinco equipamentos com quantidade e descricao.

## Validacao do projeto

- `node scripts\validate-cos-atibaia-contract.cjs --git-head`: falhou, registrando a saida anterior.
- `node scripts\validate-cos-atibaia-contract.cjs`: sucesso.
- `npm run lint`: sucesso.
- `npm run build`: sucesso.

## Parecer

A correcao estabiliza a extracao do contrato ATIBAIA sem criar novas funcionalidades. A validacao local impede declarar sucesso quando qualquer campo obrigatorio divergir da saida esperada.
