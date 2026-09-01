---
name: expense-receipts-matching
description: "Use when extracting data from expense receipts via OCR, matching them against bank transactions, and categorizing business expenses."
version: 1.0.0
---

# SOP: Reconciliação de Recibos de Despesas com Transações Bancárias

## Quando Usar
- Quando o utilizador pedir: "processa estes recibos de despesas", "cruza os recibos com o banco", "categoriza as despesas do mês".

## 1. Extração de Dados de Recibos (OCR & Multimodal)
- **Upload de recibo (imagem/PDF):** O anexo é processado para extrair:
  - Valor total e moeda.
  - Data da transação e IVA.
  - Nome/fornecedor e padrão de despesa.
- **Ferramenta:** `documents.files.upload` + extração de texto do recibo (via multimodal/document extraction).

## 2. Reconciliação com o Banco (Sandbox Python)
```python
def match_receipts(receipts, bank_txns, tolerance=5.0):
    matches = []
    for r in receipts:
        best = None
        for txn in bank_txns:
            if abs(r['amount'] - txn['amount']) <= tolerance and (r['date'] - txn['date']).days <= 3:
                best = txn; break
        matches.append({'receipt': r, 'match': best,
                        'status': 'matched' if best else 'unmatched'})
    return matches
```

## 3. Categorização e Renderização
1. **Execução em Sandbox:** Corre o script `match_receipts` para cruzar recibos com movimentos do banco.
2. **Categorização:** Classifica as despesas (Transportes, Alimentação, Fornecedores, Propriedade, etc.).
3. **Artefacto Vivo:** Renderiza painel HTML com resumo por categoria, totale de não reconciliados.