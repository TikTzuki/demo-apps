#!/bin/sh
set -ex

npx --no-update-notifier prisma migrate deploy
npx --no-update-notifier tsx prisma/seed-admin.ts

exec /sbin/tini -- node server.js
