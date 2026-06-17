.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "  hackaton-2k26"
	@echo ""
	@echo "  Setup"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  make install          Vérifie les dépendances (bun, docker) et installe les packages"
	@echo "  make .env             Crée tous les fichiers .env depuis les .env.example"
	@echo "  make down             Éteint le docker compose (MongoDB + MailHog)"
	@echo "  make clean            Supprime node_modules, .next, dist, .expo, .turbo, ios, android"
	@echo ""
	@echo "  Démarrage"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  make up               Expo Go  │ lance docker + content + app (QR code Expo Go)"
	@echo "  make up-ngrok         Expo Go  │ idem + tunnel ngrok → URL publique dans apps/application/.env"
	@echo "  make up-start         Natif    │ lance docker + content + expo run:android (build natif)"
	@echo "  make up-start-ngrok   Natif    │ idem + tunnel ngrok → URL publique dans apps/application/.env"
	@echo ""
	@echo "  Individuel"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  make dev-content      Lance uniquement l'app content (Payload CMS)"
	@echo "  make dev-app          Lance uniquement l'app mobile (Expo Go)"
	@echo "  make seed             Crée les comptes de démo (nécessite la base démarrée)"
	@echo "  make test             Lance les tests d'intégration backend (nécessite la base démarrée)"
	@echo ""

packages/docker/.env:
	cd packages/docker && cp .env.example .env

apps/content/.env:
	cd apps/content && cp .env.example .env

apps/application/.env:
	cd apps/application && cp .env.example .env

.env: packages/docker/.env apps/content/.env apps/application/.env
	@echo "All .env files have been created."

requirement:
	@echo "Checking for bun..."
	@command -v bun >/dev/null 2>&1 || { echo >&2 "bun is required but not installed. See https://bun.sh"; exit 1; }
	@echo "Checking for Docker..."
	@command -v docker >/dev/null 2>&1 || { echo >&2 "Docker is required but not installed. See https://docs.docker.com/get-docker/"; exit 1; }
	@echo "All required tools are installed."

requirement-ngrok: requirement
	@echo "Checking for ngrok..."
	@command -v ngrok >/dev/null 2>&1 || { echo >&2 "ngrok is required but not installed. See https://ngrok.com/download"; exit 1; }
	@echo "ngrok is installed."

install: requirement
	@echo "Installing dependencies..."
	bun install

up: .env install
	@bash scripts/setup-local.sh
	bun dev; $(MAKE) down

up-start: .env install
	@bash scripts/setup-local.sh
	bun run dev:build; $(MAKE) down

up-ngrok: .env requirement-ngrok install
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File scripts/setup-ngrok.ps1; \
	else \
		./scripts/setup-ngrok.sh; \
	fi
	bun dev; $(MAKE) down; pkill -f "ngrok http" 2>/dev/null || true

up-start-ngrok: .env requirement-ngrok install
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File scripts/setup-ngrok.ps1; \
	else \
		./scripts/setup-ngrok.sh; \
	fi
	bun run dev:build; $(MAKE) down; pkill -f "ngrok http" 2>/dev/null || true

down:
	cd packages/docker && docker compose down

clean:
	@echo "Cleaning up node_modules and build/cache folders..."
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name ".next" -type d -prune -exec rm -rf '{}' +
	find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name ".expo" -type d -prune -exec rm -rf '{}' +
	find . -name "ios" -type d -prune -exec rm -rf '{}' +
	find . -name "android" -type d -prune -exec rm -rf '{}' +

dev-content:
	bun turbo run dev --filter=@hackaton-2k26/content

dev-app:
	bun turbo run dev --filter=@hackaton-2k26/application

seed:
	bun --filter=@hackaton-2k26/content seed

test:
	bun --filter=@hackaton-2k26/content test:int

.PHONY: help requirement requirement-ngrok install up up-start up-ngrok up-start-ngrok down clean dev-content dev-app seed test
