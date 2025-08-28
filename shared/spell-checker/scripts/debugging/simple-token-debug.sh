#!/bin/bash

# Simplified token debug script with better input handling

echo "🔍 Simple JWT Token Debug"
echo "========================="
echo ""

echo "Please provide your JWT token:"
echo "1. Copy your token from browser console"
echo "2. Paste it below (you won't see it as you type for security)"
echo "3. Press Enter when done"
echo ""

# Use -s (silent) to hide input, -r to preserve backslashes
echo -n "Token: "
read -s USER_TOKEN
echo ""

# Check if token was provided
if [ -z "$USER_TOKEN" ]; then
    echo "❌ No token provided. Let's try a different approach."
    echo ""
    echo "Alternative method - create a token file:"
    echo "1. Copy your token from browser"
    echo "2. Run: echo 'YOUR_TOKEN' > token.txt"
    echo "3. Run: ./simple-token-debug.sh token.txt"
    
    if [ "$1" = "token.txt" ] && [ -f "token.txt" ]; then
        echo "📁 Reading token from file..."
        USER_TOKEN=$(cat token.txt | tr -d '\n\r ')
        echo "✅ Token loaded from file"
    else
        exit 1
    fi
fi

# Validate token format
if [[ ! "$USER_TOKEN" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    echo "❌ Invalid JWT token format!"
    echo "Expected: header.payload.signature"
    echo "Got length: ${#USER_TOKEN}"
    echo "First 50 chars: ${USER_TOKEN:0:50}..."
    exit 1
fi

echo "✅ Token format looks valid (length: ${#USER_TOKEN})"
echo ""

# Extract and decode header
echo "🔍 Analyzing Token Header"
echo "========================="

HEADER=$(echo "$USER_TOKEN" | cut -d'.' -f1)

# Add padding for base64 decoding
add_padding() {
    local input=$1
    while [ $((${#input} % 4)) -ne 0 ]; do
        input="${input}="
    done
    echo "$input"
}

HEADER_PADDED=$(add_padding "$HEADER")

# Try to decode header
if command -v base64 >/dev/null 2>&1; then
    DECODED_HEADER=$(echo "$HEADER_PADDED" | base64 -d 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$DECODED_HEADER" ]; then
        echo "✅ Header decoded successfully:"
        
        # Try to format as JSON if jq is available
        if command -v jq >/dev/null 2>&1; then
            echo "$DECODED_HEADER" | jq . 2>/dev/null || echo "$DECODED_HEADER"
            
            # Extract algorithm
            ALG=$(echo "$DECODED_HEADER" | jq -r '.alg' 2>/dev/null)
            KID=$(echo "$DECODED_HEADER" | jq -r '.kid // "none"' 2>/dev/null)
        else
            echo "$DECODED_HEADER"
            # Extract algorithm without jq
            ALG=$(echo "$DECODED_HEADER" | grep -o '"alg":"[^"]*"' | cut -d'"' -f4)
            KID=$(echo "$DECODED_HEADER" | grep -o '"kid":"[^"]*"' | cut -d'"' -f4)
        fi
        
        echo ""
        echo "🔧 Algorithm: $ALG"
        echo "🆔 Key ID: ${KID:-none}"
        
        if [ "$ALG" != "RS256" ]; then
            echo "❌ Wrong algorithm! Expected RS256, got: $ALG"
            echo "💡 Your JWT validator is set up for RS256 but your token uses $ALG"
        else
            echo "✅ Algorithm matches (RS256)"
        fi
    else
        echo "❌ Could not decode header"
        echo "Raw header: $HEADER"
    fi
else
    echo "❌ base64 command not found"
fi

echo ""

# Extract and decode payload
echo "🔍 Analyzing Token Payload"
echo "=========================="

PAYLOAD=$(echo "$USER_TOKEN" | cut -d'.' -f2)
PAYLOAD_PADDED=$(add_padding "$PAYLOAD")

if command -v base64 >/dev/null 2>&1; then
    DECODED_PAYLOAD=$(echo "$PAYLOAD_PADDED" | base64 -d 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$DECODED_PAYLOAD" ]; then
        echo "✅ Payload decoded successfully:"
        
        if command -v jq >/dev/null 2>&1; then
            echo "$DECODED_PAYLOAD" | jq . 2>/dev/null || echo "$DECODED_PAYLOAD"
            
            # Extract key fields
            USER_ID=$(echo "$DECODED_PAYLOAD" | jq -r '.userId // .sub // .user_id // "unknown"' 2>/dev/null)
            PERMISSIONS=$(echo "$DECODED_PAYLOAD" | jq -r '.permissions // []' 2>/dev/null)
            ROLES=$(echo "$DECODED_PAYLOAD" | jq -r '.roles // []' 2>/dev/null)
            EXP=$(echo "$DECODED_PAYLOAD" | jq -r '.exp // "unknown"' 2>/dev/null)
        else
            echo "$DECODED_PAYLOAD"
            # Extract without jq (basic)
            USER_ID=$(echo "$DECODED_PAYLOAD" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4)
            EXP=$(echo "$DECODED_PAYLOAD" | grep -o '"exp":[0-9]*' | cut -d':' -f2)
        fi
        
        echo ""
        echo "👤 User: ${USER_ID:-unknown}"
        echo "🔑 Permissions: $PERMISSIONS"
        echo "👥 Roles: $ROLES"
        echo "⏰ Expires: $EXP"
        
        # Check expiration
        if [ "$EXP" != "unknown" ] && [ "$EXP" != "null" ]; then
            CURRENT_TIME=$(date +%s)
            if [ "$EXP" -lt "$CURRENT_TIME" ]; then
                echo "❌ TOKEN IS EXPIRED!"
                echo "   Expired: $(date -d @$EXP 2>/dev/null || echo 'unknown')"
                echo "   Current: $(date)"
            else
                TIME_LEFT=$((EXP - CURRENT_TIME))
                echo "✅ Token valid for $TIME_LEFT more seconds"
            fi
        fi
        
        # Check permissions
        HAS_PERMISSION=false
        if echo "$PERMISSIONS$ROLES" | grep -q "spellcheck\|administrator\|immigration_services_officer"; then
            HAS_PERMISSION=true
        fi
        
        if [ "$HAS_PERMISSION" = true ]; then
            echo "✅ Token has spellcheck permissions"
        else
            echo "⚠️  Token may lack spellcheck permissions"
        fi
    else
        echo "❌ Could not decode payload"
    fi
fi

echo ""

# Test JWT validator directly
echo "🧪 Testing JWT Validator"
echo "========================"

echo "Testing direct validation..."

# Check if JWT validator is running
if ! curl -s -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "❌ JWT Validator is not running"
    echo "💡 Start it first: cd jwt-validator && npm start"
    exit 1
fi

# Test validation
TEST_RESULT=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST http://localhost:3001/validate \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$USER_TOKEN\"}" 2>/dev/null)

HTTP_CODE=$(echo "$TEST_RESULT" | tail -n1 | sed 's/HTTP_CODE://')
RESPONSE_BODY=$(echo "$TEST_RESULT" | sed '$d')

echo "📊 Validation Result:"
echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "✅ JWT Validator accepts your token!"
    echo "💡 If nginx still rejects it, the issue is with nginx configuration"
    
    # Test nginx
    echo ""
    echo "🧪 Testing nginx proxy..."
    NGINX_TEST=$(curl -s -w "HTTP_CODE:%{http_code}" \
        -X POST http://localhost:8010/v2/check \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=test&language=en-US" 2>/dev/null)
        
    NGINX_CODE=$(echo "$NGINX_TEST" | tail -n1 | sed 's/HTTP_CODE://')
    
    if [ "$NGINX_CODE" = "200" ]; then
        echo "✅ nginx proxy works too! Authentication is successful!"
    else
        echo "❌ nginx proxy failed (HTTP $NGINX_CODE)"
        echo "💡 Check nginx logs: tail -f /tmp/nginx_languagetool_error.log"
    fi
    
else
    echo ""
    echo "❌ JWT Validator rejects your token"
    echo "💡 This is the root cause of your authentication issue"
    
    # Show recent validator logs
    if [ -f "logs/jwt-validator-debug.log" ]; then
        echo ""
        echo "📋 Recent validator logs:"
        tail -20 logs/jwt-validator-debug.log | grep -E "(ERROR|DEBUG|❌|⚠️)" | tail -10
    fi
fi

echo ""
echo "🔧 Next steps:"
if [ "$HTTP_CODE" != "200" ]; then
    echo "1. Check if you have the correct RSA public key"
    echo "2. Verify the key ID (kid) matches your JWKS"
    echo "3. Ensure token has required permissions"
    echo "4. Check token expiration"
else
    echo "1. JWT validation works - check nginx configuration"
    echo "2. View nginx error logs for details"
fi

echo ""
echo "📝 Debug commands:"
echo "tail -f logs/jwt-validator-debug.log  # JWT validator logs"
echo "tail -f /tmp/nginx_languagetool_error.log  # nginx error logs"