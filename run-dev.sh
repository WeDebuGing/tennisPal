#!/usr/bin/env bash
# TennisPal — Development Mode
# Runs Vite dev server (hot reload) + Flask API separately.
set -euo pipefail
cd "$(dirname "$0")"

cleanup() { kill 0 2>/dev/null; }
trap cleanup EXIT

echo "🔧 Starting Flask API on http://localhost:5001"
cd api
python app.py &
cd ..

echo "⚡ Starting Vite dev server on http://localhost:5173"
cd frontend
npm run dev &

wait
