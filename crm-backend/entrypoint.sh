#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit push 2>&1 || echo "Migration warning (non-fatal)"

echo "Starting server..."
node dist/index.js
