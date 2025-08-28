#!/bin/bash

# Debug RS256 token validation issues

echo "🔍 Debugging RS256 Token Validation"
echo "===================================="
echo ""

# Step 1: Check JWT validator service
echo "📋 Step 1: Checking JWT Validator Service"
echo "=========================================="

if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ JWT Validator is running"
    
    # Get detailed health info
    HEALTH_INFO=$(curl -s http://localhost:3001/health)
    echo "📊 Service Details:"
    echo "$HEALTH_INFO" | jq . 2>/dev/null || echo "$HEALTH_INFO"
    
    # Check algorithm
    ALGORITHM=$(echo "$HEALTH_INFO" | jq -r '.algorithm // "unknown"' 2>/dev/null)
    KEY_SOURCE=$(echo "$HEALTH_INFO" | jq -r '.keySource // "unknown"' 2>/dev/null)
    echo ""
    echo "🔧 Algorithm: $ALGORITHM"
    echo "🔑 Key Source: $KEY_SOURCE"
    
    if [ "$ALGORITHM" != "RS256" ]; then
        echo "❌ Algorithm should be RS256, found: $ALGORITHM"
    fi
else
    echo "❌ JWT Validator is not responding"
    echo "💡 Check if it's running: ps aux | grep node"
    exit 1
fi

echo ""

# Step 2: Test key loading
echo "📋 Step 2: Testing Public Key Loading"
echo "======================================"

if curl -s http://localhost:3001/test-key > /dev/null 2>&1; then
    echo "🔑 Key loading test:"
    KEY_TEST=$(curl -s http://localhost:3001/test-key)
    echo "$KEY_TEST" | jq . 2>/dev/null || echo "$KEY_TEST"
    
    # Check for errors in key loading
    if echo "$KEY_TEST" | grep -q "error"; then
        echo "❌ Key loading has errors"
        echo "💡 Check your public key file or JWKS URL"
    else
        echo "✅ Public key loaded successfully"
    fi
else
    echo "❌ Cannot test key loading"
    echo "💡 Check if JWT validator is in development mode"
fi

echo ""

# Step 3: Get and analyze the actual token
echo "📋 Step 3: Token Analysis"
echo "========================="

echo "Please provide your JWT token for analysis."
echo "💡 Get it from browser console: localStorage.getItem('id_token')"
echo ""
read -p "Paste your JWT token here: " USER_TOKEN

if [ -z "$USER_TOKEN" ]; then
    echo "❌ No token provided. Cannot continue analysis."
    exit 1
fi

echo ""
echo "🔍 Analyzing your token..."

# Decode header and payload
HEADER=$(echo "$USER_TOKEN" | cut -d'.' -f1)
PAYLOAD=$(echo "$USER_TOKEN" | cut -d'.' -f2)

# Add base64 padding if needed
add_padding() {
    local input=$1
    local padding=$((4 - ${#input} % 4))
    if [ $padding -ne 4 ]; then
        for i in $(seq 1 $padding); do
            input="${input}="
        done
    fi
    echo "$input"
}

HEADER_PADDED=$(add_padding "$HEADER")
PAYLOAD_PADDED=$(add_padding "$PAYLOAD")

echo "🔍 Token Header:"
DECODED_HEADER=$(echo "$HEADER_PADDED" | base64 -d 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$DECODED_HEADER" | jq . 2>/dev/null || echo "$DECODED_HEADER"
    
    TOKEN_ALG=$(echo "$DECODED_HEADER" | jq -r '.alg // "unknown"' 2>/dev/null)
    TOKEN_KID=$(echo "$DECODED_HEADER" | jq -r '.kid // "none"' 2>/dev/null)
    
    echo ""
    echo "🔧 Token Algorithm: $TOKEN_ALG"
    echo "🆔 Key ID (kid): $TOKEN_KID"
    
    if [ "$TOKEN_ALG" != "RS256" ]; then
        echo "❌ Token algorithm mismatch! Expected RS256, found: $TOKEN_ALG"
    fi
else
    echo "❌ Could not decode token header"
    exit 1
fi

echo ""
echo "🔍 Token Payload:"
DECODED_PAYLOAD=$(echo "$PAYLOAD_PADDED" | base64 -d 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$DECODED_PAYLOAD" | jq . 2>/dev/null || echo "$DECODED_PAYLOAD"
    
    USER_ID=$(echo "$DECODED_PAYLOAD" | jq -r '.userId // .sub // .user_id // "unknown"' 2>/dev/null)
    PERMISSIONS=$(echo "$DECODED_PAYLOAD" | jq -r '.permissions // []' 2>/dev/null)
    ROLES=$(echo "$DECODED_PAYLOAD" | jq -r '.roles // []' 2>/dev/null)
    USER_ATTRS=$(echo "$DECODED_PAYLOAD" | jq -r '.user_attributes // {}' 2>/dev/null)
    EXPIRY=$(echo "$DECODED_PAYLOAD" | jq -r '.exp // "unknown"' 2>/dev/null)
    
    echo ""
    echo "👤 User ID: $USER_ID"
    echo "🔑 Permissions: $PERMISSIONS"
    echo "👥 Roles: $ROLES" 
    echo "📝 User Attributes: $USER_ATTRS"
    echo "⏰ Expires: $EXPIRY ($(date -d @$EXPIRY 2>/dev/null || echo 'Invalid'))"
    
    # Check if token is expired
    CURRENT_TIME=$(date +%s)
    if [ "$EXPIRY" != "unknown" ] && [ "$EXPIRY" -lt "$CURRENT_TIME" ]; then
        echo "❌ TOKEN IS EXPIRED!"
        echo "   Current time: $(date)"
        echo "   Token expired: $(date -d @$EXPIRY)"
    fi
    
    # Check permissions
    HAS_SPELLCHECK=false
    if echo "$PERMISSIONS" | grep -q "spellcheck\|administrator\|immigration_services_officer"; then
        HAS_SPELLCHECK=true
    fi
    if echo "$ROLES" | grep -q "administrator\|immigration_services_officer"; then
        HAS_SPELLCHECK=true  
    fi
    if echo "$USER_ATTRS" | grep -q "administrator\|immigration_services_officer"; then
        HAS_SPELLCHECK=true
    fi
    
    if [ "$HAS_SPELLCHECK" = true ]; then
        echo "✅ Token has appropriate permissions for spellcheck"
    else
        echo "⚠️  Token may lack spellcheck permissions"
        echo "💡 Required: spellcheck, administrator, or immigration_services_officer"
    fi
    
else
    echo "❌ Could not decode token payload"
    exit 1
fi

echo ""

# Step 4: Test JWT validator directly
echo "📋 Step 4: Direct JWT Validator Test"  
echo "===================================="

echo "🧪 Testing token validation directly with JWT validator..."

DIRECT_TEST=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST http://localhost:3001/validate \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$USER_TOKEN\"}")

HTTP_CODE=$(echo "$DIRECT_TEST" | tail -n1 | sed 's/HTTP_CODE://')
RESPONSE_BODY=$(echo "$DIRECT_TEST" | sed '$d')

echo "📊 Direct validation result:"
echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Direct validation PASSED"
else
    echo "❌ Direct validation FAILED"
    echo "💡 This is the root cause of the authentication failure"
fi

echo ""

# Step 5: Test nginx proxy 
echo "📋 Step 5: Testing nginx Proxy"
echo "==============================="

if curl -s -f http://localhost:8010/health > /dev/null 2>&1; then
    echo "✅ nginx proxy is running"
    
    echo "🧪 Testing authenticated request via nginx..."
    
    PROXY_TEST=$(curl -s -w "HTTP_CODE:%{http_code}" \
        -X POST http://localhost:8010/v2/check \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=test&language=en-US")
    
    PROXY_HTTP_CODE=$(echo "$PROXY_TEST" | tail -n1 | sed 's/HTTP_CODE://')
    PROXY_RESPONSE_BODY=$(echo "$PROXY_TEST" | sed '$d')
    
    echo "📊 Proxy test result:"
    echo "HTTP Status: $PROXY_HTTP_CODE"
    echo "Response: $PROXY_RESPONSE_BODY"
    
    if [ "$PROXY_HTTP_CODE" = "200" ]; then
        echo "✅ Proxy authentication PASSED"
    else
        echo "❌ Proxy authentication FAILED" 
        echo "💡 Check nginx error logs: tail -f /tmp/nginx_languagetool_error.log"
    fi
    
else
    echo "❌ nginx proxy is not running"
    echo "💡 Start nginx: sudo nginx -c $(pwd)/nginx/nginx.conf"
fi

echo ""

# Step 6: Check logs
echo "📋 Step 6: Recent Log Analysis"
echo "==============================="

echo "🔍 Recent JWT validator logs:"
if [ -f "logs/jwt-validator-rs256.log" ]; then
    echo "--- Last 10 lines ---"
    tail -10 logs/jwt-validator-rs256.log
else
    echo "❌ No RS256 log file found"
fi

echo ""
echo "🔍 Recent nginx error logs:"
if [ -f "/tmp/nginx_languagetool_error.log" ]; then
    echo "--- Last 5 lines ---"
    tail -5 /tmp/nginx_languagetool_error.log 2>/dev/null || echo "No recent errors"
else
    echo "❌ No nginx error log found"
fi

echo ""

# Step 7: Recommendations
echo "📋 Step 7: Troubleshooting Recommendations"
echo "==========================================="

echo "Based on the analysis above:"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "🎯 PRIMARY ISSUE: JWT Validator is rejecting the token"
    echo ""
    echo "Possible causes:"
    echo "1️⃣  Public key mismatch - wrong public key for your tokens"
    echo "2️⃣  Token expired - check expiration time above"
    echo "3️⃣  Algorithm mismatch - should be RS256"
    echo "4️⃣  Missing key ID (kid) - token kid doesn't match available keys"
    echo "5️⃣  Permission issues - token lacks required permissions"
    echo ""
    echo "🔧 Next steps:"
    echo "• Verify you have the CORRECT public key from your main app"
    echo "• Check token expiration time"
    echo "• Ensure key ID (kid) matches if using JWKS"
    echo "• Add debug logging to JWT validator"
    
else
    echo "🎯 JWT Validator works, check nginx configuration"
    echo "• Verify nginx is forwarding auth requests correctly"
    echo "• Check nginx error logs for details"
fi

echo ""
echo "📝 Debug commands:"
echo "==================="
echo "• View JWT validator logs: tail -f logs/jwt-validator-rs256.log"
echo "• View nginx error logs: tail -f /tmp/nginx_languagetool_error.log"
echo "• Restart JWT validator: ./setup-rs256-jwt.sh"
echo "• Test direct validation: curl -X POST http://localhost:3001/validate -H 'Content-Type: application/json' -d '{\"token\":\"YOUR_TOKEN\"}'"