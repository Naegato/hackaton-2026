#!/bin/bash
set -e

ENV_FILE="apps/application/.env"
CONTENT_ENV_FILE="apps/content/.env"

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
        # sed -i a une syntaxe différente entre BSD (macOS) et GNU (Linux) → perl est portable
        perl -pi -e "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$URL/|" "$ENV_FILE"
        echo "Updated $ENV_FILE -> EXPO_PUBLIC_API_URL=$URL/"

        # Met aussi à jour GOOGLE_REDIRECT_URI dans le backend :
        # quand le téléphone suit la redirection Google, il doit joindre le callback
        # via ngrok (localhost n'est pas accessible depuis l'appareil physique).
        CALLBACK_URL="$URL/api/oauth/google/callback"
        perl -pi -e "s|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=$CALLBACK_URL|" "$CONTENT_ENV_FILE"
        echo "Updated $CONTENT_ENV_FILE -> GOOGLE_REDIRECT_URI=$CALLBACK_URL"
        echo ""
        echo "⚠ Ajoute cette URL dans Google Cloud Console > Credentials > OAuth 2.0 > Authorized redirect URIs :"
        echo "  $CALLBACK_URL"
        exit 0
    fi
    sleep 1
done

echo "ERROR: Could not get ngrok URL after 30 seconds" >&2
kill $NGROK_PID 2>/dev/null || true
exit 1
