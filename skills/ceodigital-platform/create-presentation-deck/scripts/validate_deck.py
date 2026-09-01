"""
validate_deck.py - Validador de Estrutura de Slides PPTX para Sandbox.
Garante que o deck executivo cumpre os padrões de legibilidade e impacto.
"""

import json
from typing import List, Dict, Any

MAX_BULLETS_PER_SLIDE = 6
MAX_CHARS_PER_BULLET = 160

def validate_deck_payload(deck: Dict[str, Any]) -> Dict[str, Any]:
    slides = deck.get("slides", [])
    errors = []
    warnings = []
    
    if not slides:
        return {"valid": False, "errors": ["O deck não contém slides."]}
        
    for idx, slide in enumerate(slides, 1):
        title = slide.get("title", "").strip()
        if not title:
            errors.append(f"Slide {idx}: Título obrigatório em falta.")
            
        bullets = slide.get("bullets", [])
        if len(bullets) > MAX_BULLETS_PER_SLIDE:
            warnings.append(f"Slide {idx}: {len(bullets)} tópicos excedem o limite recomendado de {MAX_BULLETS_PER_SLIDE}.")
            
        for b_idx, bullet in enumerate(bullets, 1):
            if len(bullet) > MAX_CHARS_PER_BULLET:
                warnings.append(f"Slide {idx}, Tópico {b_idx}: Texto demasiado longo ({len(bullet)} chars). Reduz para clareza executiva.")
                
    return {
        "valid": len(errors) == 0,
        "slide_count": len(slides),
        "errors": errors,
        "warnings": warnings
    }

if __name__ == "__main__":
    sample = {
        "slides": [
            {"title": "Capa", "bullets": ["Subtítulo executivo"]},
            {"title": "Resumo", "bullets": ["Ponto 1", "Ponto 2"]}
        ]
    }
    print(json.dumps(validate_deck_payload(sample), indent=2))
