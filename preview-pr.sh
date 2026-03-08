#!/usr/bin/env bash
# Usage: preview-pr.sh <branch-name-or-pr-number>
set -euo pipefail

ARG="${1:?Usage: preview-pr.sh <branch-or-pr-number>}"
cd /opt/tennispal-dev

# Fetch latest
git fetch origin

BRANCH=""
PR_NUM=""

# If numeric, treat as PR number
if [[ "$ARG" =~ ^[0-9]+$ ]]; then
  PR_NUM="$ARG"
  echo "📥 Fetching PR #$ARG..."
  git fetch origin pull/$ARG/head:pr-$ARG
  git checkout pr-$ARG
  BRANCH="pr-$ARG"
else
  echo "📥 Checking out branch: $ARG"
  git checkout -B "$ARG" "origin/$ARG"
  BRANCH="$ARG"
fi

COMMIT_SHA=$(git rev-parse --short HEAD)
DEPLOY_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Write deploy metadata
cat > /opt/tennispal-dev/deploy_info.json << EOF
{
  "branch": "$BRANCH",
  "pr_number": ${PR_NUM:-null},
  "deploy_time": "$DEPLOY_TIME",
  "commit_sha": "$COMMIT_SHA"
}
EOF

echo "📝 Deploy info written: branch=$BRANCH pr=$PR_NUM commit=$COMMIT_SHA"

# Install Python deps
echo "📦 Installing Python deps..."
source venv/bin/activate
pip install -q -r requirements.txt

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install --silent
npm run build
cd ..

# Copy prod DB and apply migrations
echo "🗄️ Copying prod database..."
cp /opt/tennispal/api/instance/tennispal.db api/instance/tennispal.db

echo "🔧 Applying schema migrations..."
cd api
python -c "
import sys; sys.path.insert(0, '.')
from app import app
from models import db
with app.app_context():
    for col, typ, default in [
        ('city', 'VARCHAR(100)', '\"Pittsburgh\"'),
        ('is_admin', 'BOOLEAN', '0'),
        ('is_banned', 'BOOLEAN', '0'),
    ]:
        try: db.session.execute(db.text(f'ALTER TABLE user ADD COLUMN {col} {typ} DEFAULT {default}'))
        except: pass
    db.session.commit()
    print('Migrations applied')
"
cd ..

# Restart service
echo "🔄 Restarting dev server..."
systemctl restart tennispal-dev

echo "✅ Dev server updated! Preview at https://dev-tennispal.duckdns.org"
