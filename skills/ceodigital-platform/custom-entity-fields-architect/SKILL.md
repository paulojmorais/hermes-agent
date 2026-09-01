---
name: custom-entity-fields-architect
description: "Use when creating, listing, inspecting, or configuring custom entity fields and metadata schemas across CRM leads, deals, organizations, and implementation projects."
version: 1.0.0
---

# SOP: Arquitetura de Campos Personalizados (Entity Fields)

## Quando Usar
- Quando o utilizador pedir: "adiciona um campo 'Data de Renovaçāo de Contrato' aos clientes", "cria um campo personalizado 'Setor Prioritário' nas Leads", "mostra os campos customizados que temos nos Projetos".

## 1. Mapeamento de Ferramentas Reais (`entity_fields.*`)
- **Definições de Esquema:**
  - `entity_fields.definitions.list`: Lista campos personalizados ativos por entidade (`lead`, `deal`, `organization`, `person`, `project`, `workitem`).
  - `entity_fields.definitions.create`: Cria nova definição de campo (campos: `entity_type`, `name`, `slug`, `data_type`: `"text" | "number" | "boolean" | "date" | "select" | "multi_select" | "currency"`, `options`, `is_required`).
- **Valores & Inspeção:**
  - `entity_fields.values.get`: Obtém os valores dos campos personalizados preenchidos para uma entidade específica (`entity_type`, `entity_id`).

## 2. Boas Práticas de Modelação
1. **Tipagem Correta:**
   - Usar `select` ou `multi_select` para categorias fechadas, prevenindo inconsistências de dados.
   - Usar `currency` para valores monetários com identificação de divisa (EUR).
2. **Nomenclatura Clara:**
   - Slugs em formato `snake_case` descritivo (ex: `contract_renewal_date`, `industry_vertical`).
3. **Validação de Impacto:**
   - Campos `is_required = true` só devem ser definidos após garantir que não bloqueiam fluxos rápidos de criação no CRM.

## 3. Procedimento de Atuação
1. **Verificação de Existência:**
   - Executa `entity_fields.definitions.list` para verificar se já existe um campo equivalente.
2. **Criação do Campo:**
   - Invoca `entity_fields.definitions.create` com o tipo de dados e opções adequadas.
3. **Confirmação:**
   - Informa o utilizador que o novo campo já está visível nos formulários e detalhes da entidade correspondente.
