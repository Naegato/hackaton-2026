#!/usr/bin/env bash
# Upsert Docker Swarm secrets.
# Docker secrets are immutable — this script removes the old one and recreates
# it, then triggers a service update so running tasks pick up the new secret.
#
# Called by deploy.yml; can also be run manually on the swarm manager.
# All secret values are read from environment variables (set by GitHub Actions).
#
# Required env vars:
#   PAYLOAD_SECRET, DATABASE_URL, GOOGLE_CLIENT_ID,
#   GOOGLE_CLIENT_SECRET, MISTRAL_API_KEY
set -euo pipefail

STACK_NAME="${STACK_NAME:-hackaton}"

# Maps: docker_secret_name → env_var_name
declare -A SECRETS=(
  [payload_secret]=PAYLOAD_SECRET
  [database_url]=DATABASE_URL
  [google_client_id]=GOOGLE_CLIENT_ID
  [google_client_secret]=GOOGLE_CLIENT_SECRET
  [mistral_api_key]=MISTRAL_API_KEY
)

upsert_secret() {
  local secret_name="$1"
  local secret_value="$2"

  if docker secret inspect "$secret_name" &>/dev/null; then
    echo "  Rotating secret: $secret_name"
    # Remove from all services that use it before deleting
    for svc in $(docker service ls --format "{{.Name}}" --filter "name=${STACK_NAME}"); do
      if docker service inspect "$svc" --format '{{json .Spec.TaskTemplate.ContainerSpec.Secrets}}' \
          | grep -q "\"SecretName\":\"${secret_name}\""; then
        docker service update --secret-rm "$secret_name" "$svc" --detach 2>/dev/null || true
      fi
    done
    docker secret rm "$secret_name"
  else
    echo "  Creating secret: $secret_name"
  fi

  printf '%s' "$secret_value" | docker secret create "$secret_name" -
}

echo "==> Upserting Docker Swarm secrets..."
for secret_name in "${!SECRETS[@]}"; do
  env_var="${SECRETS[$secret_name]}"
  value="${!env_var:-}"
  if [[ -z "$value" ]]; then
    echo "  WARNING: $env_var is empty, skipping $secret_name"
    continue
  fi
  upsert_secret "$secret_name" "$value"
done

echo "==> Secrets updated."
