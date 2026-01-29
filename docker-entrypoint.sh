#!/bin/sh
set -eu

if [ ! -f /app/privVars.py ]; then
  cat > /app/privVars.py <<'EOF'
# Auto-generated from environment variables
DISCORD_WEBHOOK = ""
TOKEN = ""
MONGO_URL = ""
EOF
fi

if [ -n "${DISCORD_WEBHOOK:-}" ]; then
  sed -i "s|^DISCORD_WEBHOOK = .*|DISCORD_WEBHOOK = \"${DISCORD_WEBHOOK}\"|" /app/privVars.py
fi

if [ -n "${TOKEN:-}" ]; then
  sed -i "s|^TOKEN = .*|TOKEN = \"${TOKEN}\"|" /app/privVars.py
fi

if [ -n "${MONGO_URL:-}" ]; then
  sed -i "s|^MONGO_URL = .*|MONGO_URL = \"${MONGO_URL}\"|" /app/privVars.py
fi

exec "$@"
