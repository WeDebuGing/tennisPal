#!/usr/bin/env bash
# TennisPal — Local Release Mode
# Builds the frontend and serves everything from Flask (no Vite dev server needed).
set -euo pipefail
cd "$(dirname "$0")"

echo "📦 Building frontend..."
cd frontend
npm install --silent
npm run build
cd ..

echo "🎾 Starting TennisPal (release mode) on http://localhost:5001"
cd api
TENNISPAL_RELEASE=1 python app.py
