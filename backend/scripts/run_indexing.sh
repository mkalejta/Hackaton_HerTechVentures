#!/bin/bash
set -e

echo "Waiting for postgres to be healthy..."
docker compose exec backend python /app/scripts/build_knowledge_base.py
