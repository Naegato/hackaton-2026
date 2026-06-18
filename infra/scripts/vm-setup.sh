#!/usr/bin/env bash
# Run this script ONCE on the Proxmox VM via SSH (as root) to:
#   1. Initialise Docker Swarm (manager node)
#   2. Install the GitHub Actions self-hosted runner as a systemd service
#
# Usage:
#   ssh root@<VM-IP> "bash -s" < infra/scripts/vm-setup.sh
#
# Required env vars (set before running or export in shell):
#   GITHUB_REPO_URL   e.g. https://github.com/Naegato/hackaton-2026
#   RUNNER_TOKEN      Registration token from:
#                     GitHub → Settings → Actions → Runners → New self-hosted runner
set -euo pipefail

RUNNER_VERSION="2.319.1"
RUNNER_DIR="/opt/github-runner"
RUNNER_USER="runner"

# ── Prerequisites ─────────────────────────────────────────────────────────────
echo "==> Checking Docker..."
if ! command -v docker &>/dev/null; then
  echo "Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
fi

docker --version

# ── Docker Swarm init ─────────────────────────────────────────────────────────
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
  echo "==> Initialising Docker Swarm..."
  docker swarm init
  echo "Swarm initialised. Save the join token if you add worker nodes later:"
  docker swarm join-token worker
else
  echo "==> Swarm already active, skipping init."
fi

# ── GHCR login (so swarm can pull private images) ────────────────────────────
echo "==> Logging in to GitHub Container Registry..."
echo "Enter your GitHub username and a PAT with read:packages scope:"
read -r -p "GitHub username: " GH_USER
read -r -s -p "Personal Access Token: " GH_PAT
echo
echo "$GH_PAT" | docker login ghcr.io -u "$GH_USER" --password-stdin
echo "GHCR login saved."

# ── GitHub Actions self-hosted runner ────────────────────────────────────────
echo "==> Setting up GitHub Actions runner..."

if [[ -z "${GITHUB_REPO_URL:-}" || -z "${RUNNER_TOKEN:-}" ]]; then
  echo ""
  echo "ERROR: GITHUB_REPO_URL and RUNNER_TOKEN must be set."
  echo ""
  echo "  Get RUNNER_TOKEN from:"
  echo "  $GITHUB_REPO_URL → Settings → Actions → Runners → New self-hosted runner"
  echo ""
  echo "Re-run after exporting those variables:"
  echo "  export GITHUB_REPO_URL=https://github.com/Naegato/hackaton-2026"
  echo "  export RUNNER_TOKEN=<token>"
  echo "  bash infra/scripts/vm-setup.sh"
  exit 1
fi

# Create dedicated user for the runner
if ! id "$RUNNER_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$RUNNER_USER"
fi
# Grant runner access to Docker socket
usermod -aG docker "$RUNNER_USER"

mkdir -p "$RUNNER_DIR"
chown "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"

# Download runner
ARCH="x64"
RUNNER_PKG="actions-runner-linux-${ARCH}-${RUNNER_VERSION}.tar.gz"
if [[ ! -f "$RUNNER_DIR/run.sh" ]]; then
  echo "Downloading runner v${RUNNER_VERSION}..."
  curl -fsSL \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_PKG}" \
    -o "/tmp/${RUNNER_PKG}"
  tar -xzf "/tmp/${RUNNER_PKG}" -C "$RUNNER_DIR"
  chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"
fi

# Install runner OS dependencies (libicu / .NET 6 runtime required by the agent)
echo "==> Installing runner dependencies..."
"$RUNNER_DIR/bin/installdependencies.sh"

# Configure runner
sudo -u "$RUNNER_USER" "$RUNNER_DIR/config.sh" \
  --url "$GITHUB_REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "swarm-manager-$(hostname)" \
  --labels "self-hosted,linux,swarm-manager" \
  --work "$RUNNER_DIR/_work" \
  --unattended \
  --replace

# Install as systemd service
"$RUNNER_DIR/svc.sh" install "$RUNNER_USER"
"$RUNNER_DIR/svc.sh" start

echo ""
echo "==> Done! Runner status:"
"$RUNNER_DIR/svc.sh" status
echo ""
echo "Next steps:"
echo "  1. Create Docker secrets: bash infra/scripts/secrets-update.sh"
echo "  2. Push to main to trigger first deploy."
