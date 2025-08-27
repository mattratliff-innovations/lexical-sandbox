#!/bin/bash

# Start all services manually for LanguageTool JWT authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LanguageTool with JWT Authentication (Manual Setup)${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
fi

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Java found: $(java -version 2>&1 | head -n 1)${NC}"
fi

# Check nginx (optional)
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ nginx found: $(nginx -v 2>&1)${NC}"
    NGINX_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  nginx not found - will skip nginx proxy${NC}"
    NGINX_AVAILABLE=false
fi

echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start within $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Check if ports are available
echo -e "${YELLOW}🔍 Checking port availability...${NC}"

if check_port 3001; then
    echo -e "${RED}❌ Port 3001 is already in use (JWT Validator)${NC}"
    echo "Please stop the service using port 3001 or change the port in .env"
    exit 1
fi

if check_port 8081; then
    echo -e "${RED}❌ Port 8081 is already in use (LanguageTool)${NC}"
    echo "Please stop the service using port 8081"
    exit 1
fi

if [ "$NGINX_AVAILABLE" = true ] && check_port 8010; then
    echo -e "${RED}❌ Port 8010 is already in use (nginx proxy)${NC}"
    echo "Please stop the service using port 8010"
    exit 1
fi

echo -e "${GREEN}✅ All required ports are available${NC}"
echo ""

# Create log directory
mkdir -p logs

# Start JWT Validator
echo -e "${BLUE}📝 1. Starting JWT Validator...${NC}"
cd jwt-validator

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing JWT Validator dependencies...${NC}"
    npm install
fi

# Start JWT validator in background
echo -e "${GREEN}🚀 Starting JWT Validator on port 3001...${NC}"
nohup npm start > ../logs/jwt-validator.log 2>&1 &
JWT_PID=$!
echo $JWT_PID > ../logs/jwt-validator.pid

cd ..

# Wait for JWT validator to be ready
if ! wait_for_service "http://localhost:3001/health" "JWT Validator"; then
    echo -e "${RED}❌ Failed to start JWT Validator${NC}"
    kill $JWT_PID 2>/dev/null || true
    exit 1
fi

# Start LanguageTool
echo -e "${BLUE}📝 2. Starting LanguageTool Server...${NC}"

# Check if LanguageTool JAR exists
LANGUAGETOOL_JAR=""
if [ -f "languagetool/languagetool-server.jar" ]; then
    LANGUAGETOOL_JAR="languagetool/languagetool-server.jar"
elif [ -f "languagetool-server.jar" ]; then
    LANGUAGETOOL_JAR="languagetool-server.jar"
else
    # Try to find it in common locations
    for jar in $(find . -name "languagetool-server*.jar" 2>/dev/null | head -5); do
        echo -e "${YELLOW}Found JAR: $jar${NC}"
        read -p "Use this JAR? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            LANGUAGETOOL_JAR="$jar"
            break
        fi
    done
fi

if [ -z "$LANGUAGETOOL_JAR" ]; then
    echo -e "${RED}❌ LanguageTool JAR not found!${NC}"
    echo "Please ensure you have languagetool-server.jar in one of these locations:"
    echo "  - ./languagetool/languagetool-server.jar"
    echo "  - ./languagetool-server.jar"
    kill $JWT_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}📦 Using LanguageTool JAR: $LANGUAGETOOL_JAR${NC}"

# Start LanguageTool with reduced memory settings
echo -e "${GREEN}🚀 Starting LanguageTool on port 8081 (reduced memory for compatibility)...${NC}"
nohup java -Xms256m -Xmx1g \
    -Djava.awt.headless=true \
    -Dfile.encoding=UTF-8 \
    -cp "$LANGUAGETOOL_JAR" \
    org.languagetool.server.HTTPServer \
    --port 8081 \
    --public \
    --allow-origin "*" \
    --maxTextLength 50000 \
    > logs/languagetool.log 2>&1 &
    
LT_PID=$!
echo $LT_PID > logs/languagetool.pid

# Enhanced waiting with better feedback
echo -e "${YELLOW}⏳ Waiting for LanguageTool (this may take 60-120 seconds)...${NC}"
echo -e "${BLUE}💡 Java 24 detected - LanguageTool may need extra time to start${NC}"

# Custom wait function for LanguageTool with extended timeout
wait_for_languagetool() {
    local url=$1
    local max_attempts=120  # Increased from 30 to 120 (4 minutes)
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Check if process is still running
        if ! kill -0 "$LT_PID" 2>/dev/null; then
            echo -e "${RED}❌ LanguageTool process died after $((attempt * 2)) seconds${NC}"
            echo -e "${YELLOW}📋 Last few lines of log:${NC}"
            tail -10 logs/languagetool.log | sed 's/^/   /' || echo "   (no log output)"
            return 1
        fi
        
        # Try to connect with proper POST request (only after initial startup time)
        if [ $attempt -gt 15 ] && curl -s -f -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "text=test&language=en-US" "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ LanguageTool is ready! (took $((attempt * 2)) seconds)${NC}"
            return 0
        fi
        
        # Progress feedback
        if [ $((attempt % 15)) -eq 0 ]; then
            echo -e "${BLUE}   Still starting... ($((attempt * 2)) seconds elapsed)${NC}"
            echo -e "${BLUE}   Recent log: $(tail -1 logs/languagetool.log 2>/dev/null | cut -c1-60 || echo "no output yet")${NC}"
        else
            echo -n "."
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ LanguageTool failed to start within $((max_attempts * 2)) seconds${NC}"
    return 1
}

if ! wait_for_languagetool "http://localhost:8081/v2/check"; then
    echo -e "${RED}❌ Failed to start LanguageTool${NC}"
    echo -e "${YELLOW}💡 Try running: ./debug-languagetool.sh for more detailed diagnosis${NC}"
    echo -e "${YELLOW}💡 Or try: ./quick-start-languagetool.sh for manual startup${NC}"
    kill $JWT_PID $LT_PID 2>/dev/null || true
    exit 1
fi

# Start nginx (if available)
if [ "$NGINX_AVAILABLE" = true ]; then
    echo -e "${BLUE}📝 3. Starting nginx proxy...${NC}"
    
    # Test nginx configuration
    if nginx -t -c "$(pwd)/nginx/nginx.conf" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ nginx configuration is valid${NC}"
        
        # Start nginx
        echo -e "${GREEN}🚀 Starting nginx proxy on port 8010...${NC}"
        sudo nginx -c "$(pwd)/nginx/nginx.conf"
        
        # Wait for nginx to be ready
        if wait_for_service "http://localhost:8010/health" "nginx proxy"; then
            NGINX_STARTED=true
        else
            NGINX_STARTED=false
        fi
    else
        echo -e "${RED}❌ nginx configuration is invalid${NC}"
        nginx -t -c "$(pwd)/nginx/nginx.conf"
        NGINX_STARTED=false
    fi
else
    NGINX_STARTED=false
fi

echo ""
echo -e "${GREEN}🎉 Services Started Successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Service Information:${NC}"
echo -e "  JWT Validator:    http://localhost:3001 (PID: $JWT_PID)"
echo -e "  LanguageTool:     http://localhost:8081 (PID: $LT_PID)"
if [ "$NGINX_STARTED" = true ]; then
    echo -e "  nginx Proxy:      http://localhost:8010"
    echo ""
    echo -e "${GREEN}✅ Authenticated API: http://localhost:8010/v2/check${NC}"
else
    echo -e "  nginx Proxy:      ${RED}Not started${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Without nginx, authentication is not enforced${NC}"
    echo -e "${YELLOW}⚠️  LanguageTool is directly accessible at: http://localhost:8081/v2/check${NC}"
fi

echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo -e "  JWT Validator:    logs/jwt-validator.log"
echo -e "  LanguageTool:     logs/languagetool.log"

echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo -e "  Stop all:         ./scripts/stop-all.sh"
echo -e "  Test auth:        ./scripts/test-auth.sh"
echo -e "  View logs:        tail -f logs/*.log"

echo ""
echo -e "${GREEN}✅ Setup complete! Services are running.${NC}"