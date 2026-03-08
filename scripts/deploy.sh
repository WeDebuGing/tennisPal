#!/bin/bash
set -e

ENV="dev"
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [ "$ENV" = "prod" ]; then
  DIR="/opt/tennispal"
  SERVICE="tennispal.service"
elif [ "$ENV" = "dev" ]; then
  DIR="/opt/tennispal-dev"
  SERVICE="tennispal-dev.service"
else
  echo "Invalid env: $ENV (use dev or prod)"
  exit 1
fi

echo "=== Deploying to $ENV ($DIR) ==="

cd "$DIR"
git pull origin main

# Python deps
source venv/bin/activate
pip install -q -r api/requirements.txt

# Frontend build
cd frontend
npm install --silent
npx tsc -b && npx vite build

# Migrations
cd "$DIR/api"
python migrate_all.py

# Restart
systemctl restart "$SERVICE"
echo "=== $ENV deploy complete ==="
