#!/bin/bash
# start.sh — sobe todo o stack jurídico
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "====================================="
echo "  Stack Jurídico — Iniciando..."
echo "====================================="

# ── 1. JusBrasil Monitor (standalone, sem servidor) ──────────────────────────
echo ""
echo "[1/3] jusbrasil-monitor OK (use: node jusbrasil-monitor/src/index.js --demo)"

# ── 2. Jurídico Hub (backend na 3001 + client na 3000) ───────────────────────
echo ""
echo "[2/3] Subindo Jurídico Hub (porta 3001)..."
cd "$ROOT/juridico-hub"
[ ! -d node_modules ] && npm install --silent
node server/index.js &
HUB_PID=$!
echo "      PID $HUB_PID → http://localhost:3001"

# ── 3. SRCM Prospecção (backend na 3002 + client na 3000 com proxy) ──────────
echo ""
echo "[3/3] Subindo SRCM Prospecção (porta 3002)..."
cd "$ROOT/srcm-prospeccao"
[ ! -d node_modules ] && npm install --silent
node server/index.js &
SRCM_PID=$!
echo "      PID $SRCM_PID → http://localhost:3002"

echo ""
echo "====================================="
echo "  Serviços rodando:"
echo "  API Hub:      http://localhost:3001/api/health"
echo "  API SRCM:     http://localhost:3002/api/health"
echo ""
echo "  Para o dashboard (React dev server):"
echo "  Terminal 2 → cd juridico-hub/client && npm run dev"
echo "               acesse http://localhost:3000"
echo ""
echo "  Terminal 3 → cd srcm-prospeccao/client && npm run dev"
echo "               acesse http://localhost:3000  (mude porta no vite.config se precisar)"
echo ""
echo "  Ctrl+C para encerrar os backends"
echo "====================================="

wait $HUB_PID $SRCM_PID
