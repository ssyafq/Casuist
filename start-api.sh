#!/bin/bash
set -e

# Rebuild ChromaDB from processed cases if it doesn't exist
if [ ! -d "chroma_db" ] || [ -z "$(ls -A chroma_db 2>/dev/null)" ]; then
    echo "[Casuist] Rebuilding ChromaDB from data/processed/..."
    python -m src.chunker --input data/processed/
    echo "[Casuist] ChromaDB rebuilt."
else
    echo "[Casuist] ChromaDB already exists, skipping rebuild."
fi

# Start FastAPI
exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
