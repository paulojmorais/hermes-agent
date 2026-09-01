"""
reconcile_data.py - Motor de Reconciliação em Sandbox Python do CEODigital.
Cruza registos de duas fontes (ex: Faturação vs Extrato Bancário ou CRM vs Contabilidade).
"""

import json
from typing import List, Dict, Any

def reconcile(source_a: List[Dict[str, Any]], source_b: List[Dict[str, Any]], key_field: str, value_field: str) -> Dict[str, Any]:
    map_a = {item[key_field]: float(item.get(value_field, 0.0)) for item in source_a if key_field in item}
    map_b = {item[key_field]: float(item.get(value_field, 0.0)) for item in source_b if key_field in item}
    
    all_keys = set(map_a.keys()).union(set(map_b.keys()))
    
    matched = []
    discrepancies = []
    missing_in_b = []
    missing_in_a = []
    
    total_a = sum(map_a.values())
    total_b = sum(map_b.values())
    
    for k in sorted(all_keys):
        val_a = map_a.get(k)
        val_b = map_b.get(k)
        
        if val_a is not None and val_b is not None:
            diff = round(val_a - val_b, 2)
            if abs(diff) < 0.01:
                matched.append({"id": k, "value": val_a, "status": "exact_match"})
            else:
                discrepancies.append({
                    "id": k,
                    "value_a": val_a,
                    "value_b": val_b,
                    "difference": diff,
                    "status": "mismatch"
                })
        elif val_a is not None:
            missing_in_b.append({"id": k, "value": val_a, "status": "missing_in_target"})
        else:
            missing_in_a.append({"id": k, "value": val_b, "status": "missing_in_source"})
            
    summary = {
        "total_source_a": round(total_a, 2),
        "total_source_b": round(total_b, 2),
        "net_difference": round(total_a - total_b, 2),
        "match_count": len(matched),
        "discrepancy_count": len(discrepancies),
        "missing_count": len(missing_in_a) + len(missing_in_b),
        "reconciliation_rate_pct": round((len(matched) / max(len(all_keys), 1)) * 100, 2)
    }
    
    return {
        "summary": summary,
        "discrepancies": discrepancies,
        "missing_in_target": missing_in_b,
        "missing_in_source": missing_in_a,
        "matched": matched
    }

if __name__ == "__main__":
    # Teste de execução rápida
    sample_crm = [{"id": "INV-001", "amount": 1500.0}, {"id": "INV-002", "amount": 3200.50}]
    sample_bank = [{"id": "INV-001", "amount": 1500.0}, {"id": "INV-002", "amount": 3000.00}]
    res = reconcile(sample_crm, sample_bank, "id", "amount")
    print(json.dumps(res, indent=2))
