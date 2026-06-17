#!/bin/bash
set -e

ENV_FILE="apps/application/.env"
CONTENT_ENV_FILE="apps/content/.env"

# Remet les URLs sur localhost pour le dev web (make up)
perl -pi -e 's|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://localhost:3000/|' "$ENV_FILE"
perl -pi -e 's|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback|' "$CONTENT_ENV_FILE"

echo "Reset $ENV_FILE -> EXPO_PUBLIC_API_URL=http://localhost:3000/"
echo "Reset $CONTENT_ENV_FILE -> GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback"
