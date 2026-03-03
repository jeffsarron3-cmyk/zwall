#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# ZODL Web Wallet — Deploy Script
# Usage:
#   First deploy:  ./deploy.sh
#   Update:        ./deploy.sh
#   With options:  REPO_URL=https://github.com/you/repo ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

REPO_URL="${REPO_URL:-}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/wallet}"
APP_PORT="${APP_PORT:-80}"
COMPOSE="docker compose"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${GREEN}══ $* ${NC}"; }

# ─── 1. Check dependencies ───────────────────────────────────────────────────
step "Checking dependencies"

command -v docker  >/dev/null 2>&1 || error "Docker not installed. Install: https://docs.docker.com/engine/install/"
command -v git     >/dev/null 2>&1 || error "Git not installed: apt install git"

if ! docker compose version >/dev/null 2>&1; then
  error "Docker Compose v2 not found. Update Docker or install the plugin."
fi

info "Docker:         $(docker --version)"
info "Docker Compose: $($COMPOSE version)"

# ─── 2. Clone or update repo ─────────────────────────────────────────────────
step "Setting up project directory"

if [ -d "$DEPLOY_DIR/.git" ]; then
  info "Repo already exists at $DEPLOY_DIR — pulling latest changes..."
  cd "$DEPLOY_DIR"
  git fetch origin
  git reset --hard origin/"$(git symbolic-ref --short HEAD)"
  info "Updated to: $(git log -1 --oneline)"
elif [ -n "$REPO_URL" ]; then
  info "Cloning $REPO_URL → $DEPLOY_DIR"
  git clone "$REPO_URL" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  info "Cloned: $(git log -1 --oneline)"
else
  # Running from local directory
  DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
  cd "$DEPLOY_DIR"
  info "Using local directory: $DEPLOY_DIR"
fi

# ─── 3. Setup .env ───────────────────────────────────────────────────────────
step "Configuring environment"

if [ ! -f "$DEPLOY_DIR/backend/.env" ]; then
  if [ -f "$DEPLOY_DIR/backend/.env.example" ]; then
    cp "$DEPLOY_DIR/backend/.env.example" "$DEPLOY_DIR/backend/.env"
    warn "Created backend/.env from .env.example"
  fi
fi

# Prompt for NOWNODES_API_KEY if not set
if [ -f "$DEPLOY_DIR/backend/.env" ]; then
  source "$DEPLOY_DIR/backend/.env" 2>/dev/null || true
fi

if [ -z "${NOWNODES_API_KEY:-}" ]; then
  echo ""
  read -rp "  Enter NOWNODES_API_KEY (or press Enter to skip): " key
  if [ -n "$key" ]; then
    sed -i "s|^NOWNODES_API_KEY=.*|NOWNODES_API_KEY=$key|" "$DEPLOY_DIR/backend/.env"
    info "NOWNODES_API_KEY saved to backend/.env"
  else
    warn "NOWNODES_API_KEY not set — blockchain API calls will fail"
  fi
else
  info "NOWNODES_API_KEY: already configured"
fi

# Write APP_PORT to .env if not default
if [ "$APP_PORT" != "80" ]; then
  echo "APP_PORT=$APP_PORT" > "$DEPLOY_DIR/.env"
  info "APP_PORT set to $APP_PORT"
fi

# ─── 4. Build & start containers ─────────────────────────────────────────────
step "Building Docker images"
$COMPOSE build --no-cache

step "Starting services"
$COMPOSE up -d

# ─── 5. Health check ─────────────────────────────────────────────────────────
step "Waiting for services to be healthy"

MAX_WAIT=60
WAITED=0
until $COMPOSE ps | grep -q "healthy" || [ $WAITED -ge $MAX_WAIT ]; do
  echo -n "."
  sleep 2
  WAITED=$((WAITED + 2))
done
echo ""

if $COMPOSE ps | grep -q "unhealthy"; then
  warn "Backend may not be healthy — check logs: docker compose logs backend"
else
  info "All services running"
fi

# ─── 6. Summary ──────────────────────────────────────────────────────────────
step "Deploy complete"

SERVER_IP=$(curl -sf https://api.ipify.org 2>/dev/null || echo "localhost")

echo ""
echo -e "  App URL:    ${GREEN}http://${SERVER_IP}:${APP_PORT}${NC}"
echo -e "  API health: ${GREEN}http://${SERVER_IP}:${APP_PORT}/api/health${NC}"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f          # all logs"
echo "    docker compose logs backend -f  # backend only"
echo "    docker compose ps               # container status"
echo "    docker compose down             # stop everything"
echo "    ./deploy.sh                     # redeploy"
echo ""
