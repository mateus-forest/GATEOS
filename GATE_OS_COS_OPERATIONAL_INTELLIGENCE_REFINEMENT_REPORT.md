# GATE OS - Refinamento da inteligencia operacional do COS

## Escopo

Implementada a Etapa 1 do COS como camada de leitura, extracao, estruturacao, validacao, diagnostico e preview.

Nao foram alterados Auth, Login, Usuarios, Sessao, RLS, DRE operacional, Dashboard operacional, tabelas existentes, dados existentes ou fluxos de execucao em massa.

## Contratos

- Novo parser operacional `analyzeContractTextV2`.
- Extracao por blocos separados para locadora, locataria e fiador/garantidor.
- Captura ampliada de razao social, CNPJ/CPF, endereco, cidade, estado, CEP, representante, documento do representante, telefone, e-mail e contato principal.
- Classificacao de tipo de contrato: locacao, venda, prestacao de servico, manutencao, comodato, recorrente, avulso e outro.
- Extracao de assinatura, inicio, final, prazo, vigencia, vencimento mensal, valor mensal, valor total, caucao, entrada, parcelas, recorrencia, reajuste, multa, juros, aviso previo e foro.
- Equipamentos agora sao extraidos somente de blocos de objeto, descricao dos bens, tabela/anexo de equipamentos ou proposta comercial.
- Linhas juridicas sobre devolucao, obrigacao, manutencao, multa, foro, clausulas e assinaturas sao filtradas.

## Financeiro, DRE, Granatum e prints

- Criado schema normalizado `CosNormalizedExtraction`.
- Criada extracao de linhas DRE/gerenciais com categorias, tipos de linha, valores, totais, saldos e erros como `#DIV/0!`.
- OCR financeiro e documentos financeiros textuais agora retornam `extractedDreRows` e `diagnostics`.
- Planilhas financeiras passam a gerar diagnosticos e saldos bancarios detectados no schema normalizado.

## Diagnosticos

- Diagnosticos explicativos para estrutura financeira detectada.
- Sinalizacao de divergencia entre receita de DRE e lancamentos extraidos no preview.
- Sinalizacao de possivel diferenca entre saldo banco e saldo operacional quando o arquivo contem linhas de saldo/diferenca.
- Diagnosticos permanecem somente leitura e oferecem apenas acoes sugeridas.

## Confianca e seguranca

- Entidades extraidas carregam `confidence`, `confidenceLevel`, `warnings`, `missingFields`, `sourceSnippet`, `suggestedAction` e `actionStatus`.
- Cards exibem alta, media ou baixa confianca.
- Baixa confianca em cadastro de cliente exige confirmacao extra na revisao final.
- Acoes avancadas continuam como proxima etapa, sem execucao em massa.
- Acoes existentes continuam isoladas: cadastrar cliente, criar lancamento financeiro individual e anexar documento.

## UI

- Cards de contrato mostram locadora, locataria, contrato, equipamentos, financeiro e documento com mais clareza.
- Cards financeiros mostram diagnosticos e linhas DRE/gerenciais.
- Preview geral mostra o schema operacional normalizado.
- Modal de revisao final recebeu z-index superior ao COS/header e ajuste de altura/scroll para desktop e mobile.

## Validacao

- `npm run lint`: sucesso.
- `npm run build`: sucesso.
- `npx tsc --noEmit`: ainda falha por erros preexistentes de tipagem em varios modulos fora deste escopo; os erros introduzidos no COS foram corrigidos.
