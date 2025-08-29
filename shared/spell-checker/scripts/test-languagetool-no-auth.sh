#!/bin/bash

# Test the working LanguageTool server

echo "🧪 Testing Working LanguageTool Server"
echo "======================================"
echo ""

# Check if LanguageTool process is running
LT_PID=$(pgrep -f "languagetool-server.*HTTPServer" | head -n 1)
if [ ! -z "$LT_PID" ]; then
    echo "✅ LanguageTool process found (PID: $LT_PID)"
else
    echo "❌ No LanguageTool process found"
    echo "💡 The server might not be running. Try starting it first."
    exit 1
fi

# Test with proper POST request
echo "🔍 Testing LanguageTool with proper POST request..."
echo ""

TEST_TEXT="This is a test with a mispelled word and some grammer mistakes."

echo "📝 Sending text: '$TEST_TEXT'"
echo "🌐 URL: http://localhost:8081/v2/check"
echo ""

# Make the actual request
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "text=$TEST_TEXT&language=en-US" \
    http://localhost:8081/v2/check)

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | sed -n 's/.*HTTP_CODE:\([0-9]*\)$/\1/p')
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Results:"
echo "==========="
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! LanguageTool is working perfectly!"
    echo ""
    
    # Parse JSON response
    if command -v jq > /dev/null 2>&1; then
        echo "📋 Detailed Results (using jq):"
        echo "$RESPONSE_BODY" | jq '.'
        echo ""
        
        MATCHES=$(echo "$RESPONSE_BODY" | jq -r '.matches | length')
        echo "🔍 Found $MATCHES potential issues:"
        
        if [ "$MATCHES" -gt 0 ]; then
            echo "$RESPONSE_BODY" | jq -r '.matches[] | "  • \(.message) (Suggestion: \(.replacements[0].value // "N/A"))"'
        fi
    else
        echo "📋 Raw JSON Response:"
        echo "$RESPONSE_BODY"
        echo ""
        
        # Try to count matches without jq
        MATCHES=$(echo "$RESPONSE_BODY" | grep -o '"offset"' | wc -l | tr -d ' ')
        echo "🔍 Found approximately $MATCHES potential issues"
    fi
    
    echo ""
    echo "🎉 LanguageTool is fully functional!"
    
else
    echo "❌ Request failed with HTTP $HTTP_CODE"
    echo "📋 Response:"
    echo "$RESPONSE_BODY"
    echo ""
    echo "💡 This might indicate a server configuration issue."
fi

echo ""
echo "📋 Service Status:"
echo "=================="
echo "✅ LanguageTool Server: Running (PID: $LT_PID)"
echo "🌐 Direct API Endpoint: http://localhost:8081/v2/check"
echo "📝 Log file: logs/languagetool.log"
echo ""

# Check JWT Validator too
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ JWT Validator: Running"
    
    # Check if nginx is running
    if curl -s -f http://localhost:8010/health > /dev/null 2>&1; then
        echo "✅ nginx Proxy: Running"
        echo "🔐 Authenticated API: http://localhost:8010/v2/check"
        echo ""
        echo "💡 Your authentication setup is complete!"
        echo "💡 Run ./complete-auth-test.sh to test the full authentication flow"
    else
        echo "❌ nginx Proxy: Not running"
        echo "💡 Authentication is not enabled yet"
        echo "💡 Start nginx to enable JWT authentication"
    fi
else
    echo "❌ JWT Validator: Not running"
fi

echo ""
echo "🧪 Manual Test Commands:"
echo "========================"
echo ""
echo "# Test LanguageTool directly (no auth):"
echo "curl -X POST \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"text=Your test text here&language=en-US\" \\"
echo "  http://localhost:8081/v2/check"
echo ""

if curl -s -f http://localhost:8010/health > /dev/null 2>&1; then
    echo "# Test with authentication (generate token first):"
    echo "curl -X POST http://localhost:3001/generate-test-token"
    echo "# Then use the token:"
    echo "curl -X POST \\"
    echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
    echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
    echo "  -d \"text=Your test text here&language=en-US\" \\"
    echo "  http://localhost:8010/v2/check"
fi