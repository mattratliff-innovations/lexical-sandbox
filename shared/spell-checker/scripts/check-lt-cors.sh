#!/bin/bash

echo "Testing CORS configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test direct LanguageTool server (should have no CORS headers)
echo "Testing LanguageTool directly (port 8081):"
lt_direct_cors=$(curl -s -I "http://localhost:8081/v2/check" | grep -i "access-control" | wc -l)
echo "LanguageTool CORS headers: $lt_direct_cors (should be 0)"

if [ $lt_direct_cors -eq 0 ]; then
    echo -e "${GREEN}✓ LanguageTool correctly has no CORS headers${NC}"
else
    echo -e "${YELLOW}⚠ LanguageTool unexpectedly has CORS headers${NC}"
fi

echo ""

# Test nginx proxy (should have CORS headers)
echo "Testing nginx proxy (port 8010):"
nginx_cors=$(curl -s -I "http://localhost:8010/v2/check" | grep -i "access-control" | wc -l)
echo "nginx CORS headers: $nginx_cors (should be > 0)"

if [ $nginx_cors -gt 0 ]; then
    echo -e "${GREEN}✓ nginx correctly adds CORS headers${NC}"
    echo "CORS headers found:"
    curl -s -I "http://localhost:8010/v2/check" | grep -i "access-control"
else
    echo -e "${RED}✗ nginx is not adding CORS headers${NC}"
    echo "Response headers:"
    curl -s -I "http://localhost:8010/v2/check"
fi

echo ""

# Test OPTIONS request (preflight)
echo "Testing CORS preflight (OPTIONS request):"
options_response=$(curl -s -I -X OPTIONS "http://localhost:8010/v2/check" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

options_cors=$(echo "$options_response" | grep -i "access-control" | wc -l)
echo "OPTIONS CORS headers: $options_cors (should be > 0)"

if [ $options_cors -gt 0 ]; then
    echo -e "${GREEN}✓ OPTIONS preflight correctly handled${NC}"
    echo "Preflight headers:"
    echo "$options_response" | grep -i "access-control"
else
    echo -e "${RED}✗ OPTIONS preflight not working${NC}"
    echo "OPTIONS response:"
    echo "$options_response"
fi

echo ""

# Test actual POST request
echo "Testing actual POST request with CORS:"
post_response=$(curl -s -i -X POST "http://localhost:8010/v2/check" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "Origin: http://localhost:3000" \
    -d "text=This is a tesst text&language=en-US")

post_cors=$(echo "$post_response" | grep -i "access-control" | wc -l)
post_status=$(echo "$post_response" | head -n1 | grep -o '[0-9][0-9][0-9]')

echo "POST request status: $post_status"
echo "POST CORS headers: $post_cors (should be > 0)"

if [ "$post_status" = "200" ] && [ $post_cors -gt 0 ]; then
    echo -e "${GREEN}✓ POST request with CORS working correctly${NC}"
    echo "POST CORS headers:"
    echo "$post_response" | grep -i "access-control"
else
    echo -e "${RED}✗ POST request with CORS failed${NC}"
    echo "Full POST response:"
    echo "$post_response"
fi

echo ""
echo "Testing complete!"

# Summary
if [ $nginx_cors -gt 0 ] && [ $options_cors -gt 0 ] && [ "$post_status" = "200" ] && [ $post_cors -gt 0 ]; then
    echo -e "${GREEN}🎉 All CORS tests passed! Your setup is working correctly.${NC}"
else
    echo -e "${RED}❌ Some CORS tests failed. Check your nginx configuration.${NC}"
fi