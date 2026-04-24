#!/bin/bash

# ============================================
# AI Permit & Zoning Compliance - Start Script
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════╗"
echo "║   AI Permit & Zoning Compliance Platform     ║"
echo "║   Powered by OpenRouter AI                   ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment loaded${NC}"
else
  echo -e "${RED}✗ .env file not found!${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Kill processes on ports
cleanup_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}⟳ Killing process on port $port (PID: $pid)${NC}"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

echo -e "\n${CYAN}▸ Cleaning up ports...${NC}"
cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# Check PostgreSQL
echo -e "${CYAN}▸ Checking PostgreSQL...${NC}"
if command -v pg_isready &>/dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}⟳ Starting PostgreSQL...${NC}"
    if command -v brew &>/dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
fi

# Create database if not exists
echo -e "${CYAN}▸ Setting up database...${NC}"
createdb ${DB_NAME:-permit_zoning_db} 2>/dev/null || echo -e "${YELLOW}  Database already exists${NC}"

# Install backend dependencies
echo -e "${CYAN}▸ Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent 2>&1 | tail -1

# Seed database
echo -e "${CYAN}▸ Seeding database with sample data...${NC}"
node seed.js

# Install frontend dependencies
echo -e "${CYAN}▸ Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>&1 | tail -1

echo -e "\n${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Starting Application with Hot Reload${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Backend:  http://localhost:${BACKEND_PORT}${NC}"
echo -e "${BLUE}  Frontend: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  Demo Login: admin@permitzone.com / password123${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot reload)
cd "$SCRIPT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!

# Start frontend with react-scripts (hot reload built-in)
cd "$SCRIPT_DIR/frontend"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
