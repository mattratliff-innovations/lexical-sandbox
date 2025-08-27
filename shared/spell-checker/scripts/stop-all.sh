#!/bin/bash

# Stop all services for LanguageTool JWT authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping LanguageTool with JWT Authentication services${NC}"
echo ""

# Function to kill process by PID file
kill_by_pidfile() {
    local pidfile=$1
    local service=$2
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}🛑 Stopping $service (PID: $pid)...${NC}"
            kill "$pid"
            
            # Wait for process to stop
            local attempts=10
            while [ $attempts -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                attempts=$((attempts - 1))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}⚠️  Force killing $service...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            echo -e "${GREEN}✅ $service stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service was not running (stale PID file)${NC}"
        fi
        rm -f "$pidfile"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service${NC}"
    fi
}

# Stop JWT Validator
if [ -f "logs/jwt-validator.pid" ]; then
    kill_by_pidfile "logs/jwt-validator.pid" "JWT Validator"
else
    # Try to find and kill Node.js process
    JWT_PID=$(pgrep -f "node.*server.js" | head -n 1)
    if [ ! -z "$JWT_PID" ]; then
        echo -e "${YELLOW}🛑 Found JWT Validator process (PID: $JWT_PID), stopping...${NC}"
        kill "$JWT_PID" 2>/dev/null || true
        echo -e "${GREEN}✅ JWT Validator stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  JWT Validator process not found${NC}"
    fi
fi

# Stop LanguageTool
if [ -f "logs/languagetool.pid" ]; then
    kill_by_pidfile "logs/languagetool.pid" "LanguageTool"
else
    # Try to find and kill LanguageTool process
    LT_PID=$(pgrep -f "languagetool-server.*HTTPServer" | head -n 1)
    if [ ! -z "$LT_PID" ]; then
        echo -e "${YELLOW}🛑 Found LanguageTool process (PID: $LT_PID), stopping...${NC}"
        kill "$LT_PID" 2>/dev/null || true
        echo -e "${GREEN}✅ LanguageTool stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  LanguageTool process not found${NC}"
    fi
fi

# Stop nginx
if command -v nginx &> /dev/null; then
    if pgrep nginx > /dev/null; then
        echo -e "${YELLOW}🛑 Stopping nginx...${NC}"
        sudo nginx -s quit 2>/dev/null || sudo nginx -s stop 2>/dev/null || true
        
        # Wait for nginx to stop
        sleep 2
        
        if ! pgrep nginx > /dev/null; then
            echo -e "${GREEN}✅ nginx stopped${NC}"
        else
            echo -e "${RED}⚠️  nginx may still be running${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  nginx was not running${NC}"
    fi
fi

# Clean up any remaining processes
echo -e "${BLUE}🧹 Cleaning up any remaining processes...${NC}"

# Kill any remaining Node.js processes running our JWT validator
pkill -f "node.*jwt-validator" 2>/dev/null || true

# Kill any remaining LanguageTool processes
pkill -f "languagetool-server.*HTTPServer" 2>/dev/null || true

# Check if ports are free
check_port_free() {
    local port=$1
    local name=$2
    
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port ($name) is now free${NC}"
    else
        echo -e "${RED}⚠️  Port $port ($name) is still in use${NC}"
        echo -e "${YELLOW}   Process using port $port:${NC}"
        lsof -Pi :$port -sTCP:LISTEN | grep LISTEN || true
    fi
}

echo ""
echo -e "${BLUE}🔍 Checking port status:${NC}"
check_port_free 3001 "JWT Validator"
check_port_free 8081 "LanguageTool"
check_port_free 8010 "nginx proxy"

echo ""
echo -e "${GREEN}🎉 All services stopped!${NC}"

# Show log files if they exist
if [ -f "logs/jwt-validator.log" ] || [ -f "logs/languagetool.log" ]; then
    echo ""
    echo -e "${BLUE}📝 Log files are still available:${NC}"
    [ -f "logs/jwt-validator.log" ] && echo -e "  JWT Validator:    logs/jwt-validator.log"
    [ -f "logs/languagetool.log" ] && echo -e "  LanguageTool:     logs/languagetool.log"
    echo -e "${YELLOW}  Use 'rm logs/*.log' to clean up logs${NC}"
fi