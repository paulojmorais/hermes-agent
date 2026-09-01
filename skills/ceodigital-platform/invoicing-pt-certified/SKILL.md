---
name: invoicing-pt-certified
description: "Use when issuing, validating, or querying certified Portuguese invoices, applying fiscal compliance (IVA, ATCUD) and syncing with Moloni/InvoiceXpress."
version: 1.0.0
---

# SOP: Faturação Certificada PT (IVA, ATCUD & ERP Português)

## Quando Usar
- Quando o utilizador pedir: "emite uma fatura", "cria um rectificado", "valida uma fatura certificada", "consulta faturas", entre outras operações fiscais.

## 1. Mapeamento de Ferramentas Reais
- `int.moloni.*` / `int.invoicexpress.*`: Operações de faturação via integração ERP.
  - `invoices.create`: Cria o documento com cliente, linhas de serviços, valores e IVA.
  - `invoices.get`/`invoices.list`: Consulta faturas emitidas.
  - `invoices.receipt`: Regista pagamento de receita.
  - `invoices.rectify`: Gera fatura rectificada.
- `crm.organizations.get`: Obtém dados fiscais (NIF, morada).

## 2. Regras de Conformidade Portuguesa
1. **IVA:** Aplicar taxa de IVA correta (Normal 23%, Intermédio 13%, Reduzido 6%). Utilizar taxas específicas por serviço.
2. **ATCUD:** Quando aplicável, referenciar o código ATCUD de validação fiscal do documento.
3. **Cálculo com Paridade Decimal:** Os montantes são sempre arredondados com paridade decimal (método de arredondamento a 2 casas).

## 3. Procedimento de Atuação
1. **Preparação do Documento:** Obtém o NIF e dados do cliente via `crm.organizations.get`.
2. **Cálculo Fiscal:** Determina os valores líquidos, IVA aplicável e totais.
3. **Emissão e Registo:** Invoca a tool do ERP (`int.moloni.*`/`int.invoicexpress.*`) para criar a fatura e registar o pagamento se aplicável.
4. **Comunicação:** Apresenta comprovativo e link de acesso no chat.