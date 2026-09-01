---
name: data-migration-csv-importer
description: "Use when importing, cleaning, normalizing, or migrating tabular data (CSV, Excel, exported CRM contacts/leads/deals) into platform business entities."
version: 1.0.0
---

# SOP: Migração & Importação de Dados em Lote (CSV / Excel)

## Quando Usar
- Quando o utilizador fornecer ou carregar um ficheiro CSV/XLSX exportado de outro CRM (Salesforce, HubSpot, Pipedrive, Moloni, Excel manual).
- Quando pedir: "importa esta lista de clientes", "carrega estes contactos para o CRM", "migra estes negócios antigos".

## 1. Mapeamento de Ferramentas Reais
- **Processamento & Validação Segura em Sandbox:**
  - `execute_code`: Script Python para ler o CSV/XLSX, validar NIFs portugueses (algoritmo módulo 11), normalizar números de telefone (+351), limpar emails e desduplicar linhas.
- **Criação de Entidades no CRM:**
  - `crm.leads.create` / `crm.deals.create` / `crm.organizations.create` / `crm.persons.create`.
- **Campos Customizados:**
  - `entity_fields.definitions.list` / `entity_fields.definitions.create` para acomodar colunas específicas do ficheiro de origem.
- **Relatório de Migração:**
  - `chat.createArtifact(kind='html')` ou `renderWidget` para apresentar a tabela de pré-visualização e sumário de importação.

## 2. Procedimento de Migração em 4 Fases
1. **Inspeção & Mapeamento de Colunas:**
   - Executa script Python via `execute_code` para ler o cabeçalho e as primeiras 5 linhas.
   - Apresenta ao utilizador a correspondência de campos (ex: `Nome Empresa` ➔ `organization.name`, `NIF` ➔ `organization.tax_number`).
2. **Validação & Limpeza Prévia:**
   - Deteta registos inválidos, duplicados ou emails mal formatados.
   - Se existirem colunas sem equivalente nativo, sugere criar campos personalizados com `entity_fields.definitions.create`.
3. **Execução Controlada em Lote:**
   - Insere os registos através das ferramentas de CRM correspondentes.
4. **Relatório de Conclusão:**
   - Apresenta o scorecard final: total processado, criados com sucesso, duplicados ignorados e erros pontuais.
