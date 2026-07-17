#!/usr/bin/env bash
# Ships the current commit to a server and rebuilds the stack behind an existing proxy.
# Usage: bash deploy/deploy.sh <ssh-host> [remote-dir]
#
# Uploads in one SSH connection (servers with fail2ban dislike bursts):
#   - the committed tree (git archive HEAD)
#   - services/leads-api/.env      bot token, CRM keys
#   - deploy/.env.server as .env   public URLs, PROXY_NETWORK, analytics ids
set -euo pipefail

host=${1:?usage: deploy.sh <ssh-host> [remote-dir]}
dir=${2:-/opt/local-landings}

for required in services/leads-api/.env deploy/.env.server; do
  [ -f "$required" ] || { echo "missing $required" >&2; exit 1; }
done

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git archive --format=tar -o "$tmp/release.tar" HEAD
tar -rf "$tmp/release.tar" services/leads-api/.env
tar -rf "$tmp/release.tar" --transform 's,^deploy/.env.server$,.env,' deploy/.env.server

ssh "$host" "set -e
  mkdir -p '$dir' && tar -x -C '$dir' && cd '$dir'
  chmod 600 .env services/leads-api/.env
  docker compose -f docker-compose.yml -f deploy/docker-compose.proxy.yml up -d --build --remove-orphans
  docker compose -f docker-compose.yml -f deploy/docker-compose.proxy.yml ps" < "$tmp/release.tar"
