#!/bin/sh
set -e

echo "Initializing database..."
python init_db.py

echo "Starting Gunicorn server..."
exec gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
