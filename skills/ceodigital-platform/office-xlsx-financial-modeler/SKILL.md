---
name: office-xlsx-financial-modeler
description: "Use when creating multi-sheet Microsoft Excel (.xlsx) financial models, budget sheets, payroll tables, sales forecasts, and structured workbooks with validated formulas and formatting."
version: 1.0.0
---

# SOP: Modelação Financeira & Folhas de Cálculo Excel (.xlsx)

## Quando Usar
- Quando o utilizador pedir: "gera uma folha de cálculo em Excel", "cria um ficheiro .xlsx com o orçamento anual", "prepara a tabela de reconciliação de pagamentos em Excel", "exporta os dados de faturação para Excel".

## 1. Mapeamento de Ferramentas Reais
- **Geração de Folha de Cálculo:**
  - `chat.generateXlsx({ filename: "...", sheets: [...] })`: Constrói o ficheiro `.xlsx` binário com múltiplas abas, tipos de dados estritos e formatação de células.
- **Cálculo & Simulação Numérica Prévia em Sandbox:**
  - `execute_code`: Script Python (`pandas`, `numpy`, fórmulas financeiras) para processar os números, calcular NPV, amortizações ou IVA antes de montar as tabelas finais.

## 2. Boas Práticas de Modelação em Excel
1. **Tipagem e Formatação de Células:**
   - Valores monetários formatados como moeda (`€ #,##0.00`).
   - Percentagens formatadas com 1 a 2 casas decimais (`0.0%`).
   - Datas no formato europeu padrão (`DD/MM/AAAA`).
2. **Estrutura Multi-Aba Recomendada:**
   - **Aba 1: `Resumo_Executivo`** — KPIs principais, totais anuais e destaques.
   - **Aba 2: `Dados_Detalhados`** — Matriz completa com linhas de transação ou produtos.
   - **Aba 3: `Premissas_e_Parametros`** — Taxas de imposto, taxas de desconto e hipóteses de cálculo.
3. **Fórmulas Consistentes:**
   - Usar fórmulas padrão (`SUM`, `AVERAGE`, `IF`, `SUMIFS`, `XLOOKUP`) em maiúsculas.

## 3. Procedimento de Atuação
1. **Processamento Numérico:** Se houver cálculos complexos, executa o script em sandbox via `execute_code`.
2. **Estruturação do Ficheiro:** Monta a estrutura JSON de abas, cabeçalhos e linhas.
3. **Invocação:** Executa `chat.generateXlsx` na resposta, fornecendo o ficheiro pronto para download.
