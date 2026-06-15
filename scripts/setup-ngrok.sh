#!/bin/bash
set -e

ENV_FILE="apps/application/.env"

# Kill any existing ngrok
pkill -f "ngrok http" 2>/dev/null || true

# Start ngrok in background (port 3000 = content/Payload)
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

echo "Starting ngrok (PID: $NGROK_PID)..."
echo "Waiting for tunnel..."

# Wait up to 30 seconds for tunnel URL
for i in $(seq 1 30); do
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
        | grep -o '"public_url":"https://[^"]*"' \
        | head -1 \
        | sed 's/"public_url":"//;s/"//g')
    if [ -n "$URL" ]; then
        echo "Ngrok tunnel ready: $URL"
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$URL/|" "$ENV_FILE"
        echo "Updated $ENV_FILE -> EXPO_PUBLIC_API_URL=$URL/"
        exit 0
    fi
    sleep 1
done

echo "ERROR: Could not get ngrok URL after 30 seconds" >&2
kill $NGROK_PID 2>/dev/null || true
exit 1
