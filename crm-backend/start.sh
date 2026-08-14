#!/bin/sh
npx drizzle-kit push 2>&1 || echo "drizzle-kit push failed, continuing..."
node dist/index.js
