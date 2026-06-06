#!/bin/bash
set -e

echo "[entrypoint] Waiting for PostgreSQL..."
until python - <<'EOF'
import os, psycopg2
psycopg2.connect(os.environ["DATABASE_URL"]).close()
EOF
do
  sleep 1
done
echo "[entrypoint] PostgreSQL ready."

ARTICLE_COUNT=$(python - <<'EOF'
import os, psycopg2
try:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM articles")
    print(cur.fetchone()[0])
    conn.close()
except Exception:
    print(0)
EOF
)

if [ "$ARTICLE_COUNT" -eq 0 ]; then
    echo "[entrypoint] Empty database — running initialization..."
    python /app/scripts/build_knowledge_base.py
    echo "[entrypoint] Initialization complete."
else
    echo "[entrypoint] Database already initialized ($ARTICLE_COUNT articles) — skipping."
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
