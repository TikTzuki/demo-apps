#!/bin/sh
set -ex

npx --no-update-notifier prisma migrate deploy

exec /sbin/tini -- node server.js
