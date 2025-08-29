#!/bin/bash

# Test authentication for manually started services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing JWT Authentication for LanguageTool${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}🔍 Checking service status...${NC}"

# Check JWT Validator
if curl -s -f http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ JWT Validator is running${NC}"
else
    echo -e "${RED}❌ JWT Validator is not responding on port 3001${NC}"
    echo "Please start the JWT validator first: npm start (in jwt-validator directory)"
    exit 1
fi

# Check LanguageTool
if curl -s -f http://localhost:8081/v2/check > /dev/null; then
    echo -e "${GREEN}✅ LanguageTool is running${NC}"
else
    echo -e "${RED}❌ LanguageTool is not responding on port 8081${NC}"
    echo "Please start LanguageTool first"
    exit 1
fi

# Check nginx (optional)
NGINX_RUNNING=false
if curl -s -f http://localhost:8010/health > /dev/null; then
    echo -e "${GREEN}✅ nginx proxy is running${NC}"
    NGINX_RUNNING=true
else
    echo -e "${YELLOW}⚠️  nginx proxy is not running on port 8010${NC}"
    echo -e "${YELLOW}⚠️  Will test direct LanguageTool access (no authentication)${NC}"
fi

echo ""

# Test 1: Health checks
echo -e "${BLUE}📋 Test 1: Service Health Checks${NC}"

JWT_HEALTH=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "error")
if [ "$JWT_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ JWT Validator health check passed${NC}"
else
    echo -e "${RED}❌ JWT Validator health check failed${NC}"
fi

echo ""

# Test 2: Generate test token
echo -e "${BLUE}📋 Test 2: Generate Test Token${NC}"

TEST_TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/generate-test-token \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-user","permissions":["spellcheck"]}' 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$TEST_TOKEN_RESPONSE" ]; then
    TEST_TOKEN=$(echo "$TEST_TOKEN_RESPONSE" | jq -r '.token' 2>/dev/null)
    if [ "$TEST_TOKEN" != "null" ] && [ ! -z "$TEST_TOKEN" ]; then
        echo -e "${GREEN}✅ Test token generated successfully${NC}"
        echo -e "${BLUE}Token (first 50 chars): ${TEST_TOKEN:0:50}...${NC}"
        
        # Show decoded token info
        DECODED_INFO=$(echo "$TEST_TOKEN_RESPONSE" | jq -r '.decoded | "User: \(.userId), Expires: \(.exp)"' 2>/dev/null)
        if [ ! -z "$DECODED_INFO" ]; then
            echo -e "${BLUE}Token info: $DECODED_INFO${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to extract token from response${NC}"
        echo "$TEST_TOKEN_RESPONSE"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to generate test token${NC}"
    echo "Make sure NODE_ENV=development in jwt-validator/.env"
    exit 1
fi

echo ""

if [ "$NGINX_RUNNING" = true ]; then
    # Test 3: Unauthenticated request (should fail)
    echo -e "${BLUE}📋 Test 3: Unauthenticated Request (should fail)${NC}"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=This is a test&language=en-US" \
        http://localhost:8010/v2/check)
    
    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✅ Correctly rejected unauthenticated request (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}❌ Should have rejected unauthenticated request, got HTTP $HTTP_CODE${NC}"
    fi
    
    echo ""
    
    # Test 4: Invalid token (should fail)
    echo -e "${BLUE}📋 Test 4: Invalid Token (should fail)${NC}"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer invalid.token.here" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=This is a test&language=en-US" \
        http://localhost:8010/v2/check)
    
    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✅ Correctly rejected invalid token (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}❌ Should have rejected invalid token, got HTTP $HTTP_CODE${NC}"
    fi
    
    echo ""
    
    # Test 5: Valid token (should succeed)
    echo -e "${BLUE}📋 Test 5: Valid Token (should succeed)${NC}"
    
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=This is a test with a mispelled word&language=en-US" \
        http://localhost:8010/v2/check)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | sed 's/HTTP_CODE://')
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Authenticated request succeeded (HTTP $HTTP_CODE)${NC}"
        
        # Try to parse JSON response
        MATCHES=$(echo "$RESPONSE_BODY" | jq -r '.matches | length' 2>/dev/null || echo "parse_error")
        if [ "$MATCHES" != "parse_error" ]; then
            echo -e "${BLUE}📊 LanguageTool found $MATCHES potential issues${NC}"
            
            if [ "$MATCHES" -gt 0 ]; then
                echo -e "${BLUE}First suggestion: $(echo "$RESPONSE_BODY" | jq -r '.matches[0].message' 2>/dev/null || echo "N/A")${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Response is not valid JSON (might be an error page)${NC}"
            echo "Response: ${RESPONSE_BODY:0:200}..."
        fi
    else
        echo -e "${RED}❌ Authenticated request failed (HTTP $HTTP_CODE)${NC}"
        echo "Response: $RESPONSE_BODY"
    fi
    
    ENDPOINT_URL="http://localhost:8010/v2/check"
else
    echo -e "${BLUE}📋 Test 3: Direct LanguageTool Access (no authentication)${NC}"
    
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=This is a test with a mispelled word&language=en-US" \
        http://localhost:8081/v2/check)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | sed 's/HTTP_CODE://')
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Direct LanguageTool access works (HTTP $HTTP_CODE)${NC}"
        
        MATCHES=$(echo "$RESPONSE_BODY" | jq -r '.matches | length' 2>/dev/null || echo "parse_error")
        if [ "$MATCHES" != "parse_error" ]; then
            echo -e "${BLUE}📊 LanguageTool found $MATCHES potential issues${NC}"
        fi
    else
        echo -e "${RED}❌ Direct LanguageTool access failed (HTTP $HTTP_CODE)${NC}"
        echo "Response: $RESPONSE_BODY"
    fi
    
    ENDPOINT_URL="http://localhost:8081/v2/check (direct, no auth)"
fi

echo ""
echo -e "${GREEN}🎉 Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  JWT Validator:    http://localhost:3001"
echo -e "  LanguageTool:     http://localhost:8081"
if [ "$NGINX_RUNNING" = true ]; then
    echo -e "  Authenticated API: http://localhost:8010/v2/check"
else
    echo -e "  Direct API:       http://localhost:8081/v2/check"
fi

echo ""
if [ "$NGINX_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Full authentication setup is working!${NC}"
    echo -e "${BLUE}🔧 Your frontend should use: http://localhost:8010/v2/check${NC}"
else
    echo -e "${YELLOW}⚠️  Authentication proxy not running${NC}"
    echo -e "${BLUE}🔧 To enable authentication, start nginx with the provided config${NC}"
    echo -e "${BLUE}🔧 Without nginx, your LanguageTool has no authentication protection${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Manual Testing Commands:${NC}"
echo ""
echo -e "${YELLOW}# Test with curl (authenticated):${NC}"
echo "curl -X POST \\"
echo "  -H \"Authorization: Bearer $TEST_TOKEN\" \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"text=This is a test with a mispelled word&language=en-US\" \\"
echo "  $ENDPOINT_URL"