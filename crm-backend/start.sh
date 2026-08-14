#!/bin/sh
npx drizzle-kit push 2>&1 || true
node dist/index.js
