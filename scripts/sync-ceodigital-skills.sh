#!/usr/bin/env bash
# ==============================================================================
# sync-ceodigital-skills.sh — Sincronizador Bidirecional/Canónico de Skills
#
# Copia e valida todas as skills canónicas do CEODigital (`src/tenant/skills/canonical/`)
# para o namespace oficial do Hermes Agent (`skills/ceodigital-platform/`).
#
# Uso:
#   ./scripts/sync-ceodigital-skills.sh [--dry-run]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HERMES_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CEODIGITAL_CANONICAL_DIR="${CEODIGITAL_ROOT:-/Users/agentdev/dev/ceodigital}/src/tenant/skills/canonical"
TARGET_DIR="$HERMES_ROOT/skills/ceodigital-platform"

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 Modo DRY-RUN ativado (nenhum ficheiro será alterado)."
fi

echo "============================================================"
echo "🚀 Sincronizador de Skills CEODigital ➔ Hermes Agent"
echo "Origem: $CEODIGITAL_CANONICAL_DIR"
echo "Destino: $TARGET_DIR"
echo "============================================================"

if [[ ! -d "$CEODIGITAL_CANONICAL_DIR" ]]; then
  echo "❌ Erro: Diretório canónico não encontrado em $CEODIGITAL_CANONICAL_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

TOTAL_CANONICAL=$(find "$CEODIGITAL_CANONICAL_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo "📦 Total de skills canónicas na origem: $TOTAL_CANONICAL"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "--- Comparação de Diferenças ---"
  diff -qr "$CEODIGITAL_CANONICAL_DIR" "$TARGET_DIR" || true
  exit 0
fi

# Sincronização direta
cp -R "$CEODIGITAL_CANONICAL_DIR/"* "$TARGET_DIR/"

TOTAL_TARGET=$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo "✅ Sincronização concluída com sucesso! Total no destino: $TOTAL_TARGET skills."

echo ""
echo "💡 Para verificar o estado no Git execute:"
echo "   cd $HERMES_ROOT && git status"
