#!/bin/bash

# Fixed token debug script with proper file handling

echo "🔍 JWT Token Debug Tool"
echo "======================="
echo ""

USER_TOKEN=""

# Check if token file is provided as argument
if [ "$1" = "token.txt" ] && [ -f "token.txt" ]; then
    echo "📁 Reading token from token.txt file..."
    USER_TOKEN=$(cat token.txt | tr -d '\n\r\t ' | head -1)
    if [ ! -z "$USER_TOKEN" ]; then
        echo "✅ Token loaded from file (length: ${#USER_TOKEN})"
    else
        echo "❌ token.txt file is empty"
        exit 1
    fi
elif [ -f "token.txt" ]; then
    echo "📁 Found token.txt file. Loading token..."
    USER_TOKEN=$(cat token.txt | tr -d '\n\r\t ' | head -1)
    if [ ! -z "$USER_TOKEN" ]; then
        echo "✅ Token loaded from file (length: ${#USER_TOKEN})"
    else
        echo "❌ token.txt file is empty"
        exit 1
    fi
else
    echo "Please provide your JWT token:"
    echo "Method 1: Save token to file and run:"
    echo "  echo 'YOUR_TOKEN' > token.txt"
    echo "  ./debug-token.sh"
    echo ""
    echo "Method 2: Paste token now:"
    echo -n "Token: "
    read USER_TOKEN
    
    if [ -z "$USER_TOKEN" ]; then
        echo "❌ No token provided"
        exit 1
    fi
fi

echo ""

# Clean the token (remove any whitespace/newlines)
USER_TOKEN=$(echo "$USER_TOKEN" | tr -d '\n\r\t ')

# Validate token format (JWT has 3 parts separated by dots)
if [[ ! "$USER_TOKEN" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    echo "❌ Invalid JWT token format!"
    echo "Expected: header.payload.signature (3 parts separated by dots)"
    echo "Got: ${USER_TOKEN:0:100}..."
    echo "Length: ${#USER_TOKEN}"
    exit 1
fi

echo "✅ Token format is valid"
echo ""

# Function to add base64 padding
add_padding() {
    local input=$1
    while [ $((${#input} % 4)) -ne 0 ]; do
        input="${input}="
    done
    echo "$input"
}

# Decode header
echo "🔍 Token Header Analysis"
echo "========================"

HEADER=$(echo "$USER_TOKEN" | cut -d'.' -f1)
HEADER_PADDED=$(add_padding "$HEADER")

DECODED_HEADER=$(echo "$HEADER_PADDED" | base64 -d 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$DECODED_HEADER" ]; then
    echo "✅ Header decoded:"
    echo "$DECODED_HEADER"
    
    # Extract algorithm and key ID
    if command -v jq >/dev/null 2>&1; then
        ALG=$(echo "$DECODED_HEADER" | jq -r '.alg' 2>/dev/null)
        KID=$(echo "$DECODED_HEADER" | jq -r '.kid // "none"' 2>/dev/null)
        echo ""
        echo "🔧 Algorithm: $ALG"
        echo "🆔 Key ID (kid): $KID"
        
        if [ "$ALG" != "RS256" ]; then
            echo "❌ ALGORITHM MISMATCH!"
            echo "   Expected: RS256"
            echo "   Got: $ALG"
            echo "   Your JWT validator is configured for RS256"
        else
            echo "✅ Algorithm matches (RS256)"
        fi
    else
        echo "💡 Install jq for better analysis: brew install jq"
    fi
else
    echo "❌ Could not decode header"
    exit 1
fi

echo ""

# Decode payload
echo "🔍 Token Payload Analysis"
echo "========================="

PAYLOAD=$(echo "$USER_TOKEN" | cut -d'.' -f2)
PAYLOAD_PADDED=$(add_padding "$PAYLOAD")

DECODED_PAYLOAD=$(echo "$PAYLOAD_PADDED" | base64 -d 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$DECODED_PAYLOAD" ]; then
    echo "✅ Payload decoded:"
    
    if command -v jq >/dev/null 2>&1; then
        echo "$DECODED_PAYLOAD" | jq . 2>/dev/null
        
        # Extract important fields
        USER_ID=$(echo "$DECODED_PAYLOAD" | jq -r '.userId // .sub // .user_id // "unknown"' 2>/dev/null)
        PERMISSIONS=$(echo "$DECODED_PAYLOAD" | jq -r '.permissions // empty' 2>/dev/null)
        ROLES=$(echo "$DECODED_PAYLOAD" | jq -r '.roles // empty' 2>/dev/null)
        USER_ATTRS=$(echo "$DECODED_PAYLOAD" | jq -r '.user_attributes // empty' 2>/dev/null)
        EXP=$(echo "$DECODED_PAYLOAD" | jq -r '.exp // "unknown"' 2>/dev/null)
        ISS=$(echo "$DECODED_PAYLOAD" | jq -r '.iss // "unknown"' 2>/dev/null)
        AUD=$(echo "$DECODED_PAYLOAD" | jq -r '.aud // "unknown"' 2>/dev/null)
        
        echo ""
        echo "📋 Key Information:"
        echo "   👤 User: $USER_ID"
        echo "   🏢 Issuer: $ISS"  
        echo "   👥 Audience: $AUD"
        echo "   ⏰ Expires: $EXP"
        
        # Check expiration
        if [ "$EXP" != "unknown" ] && [ "$EXP" != "null" ]; then
            CURRENT_TIME=$(date +%s)
            if [ "$EXP" -lt "$CURRENT_TIME" ]; then
                echo "   ❌ STATUS: EXPIRED"
                echo "   📅 Expired at: $(date -d @$EXP 2>/dev/null || echo 'Invalid date')"
            else
                TIME_LEFT=$((EXP - CURRENT_TIME))
                HOURS_LEFT=$((TIME_LEFT / 3600))
                echo "   ✅ STATUS: Valid for ${HOURS_LEFT} hours ($TIME_LEFT seconds)"
            fi
        fi
        
        # Analyze permissions
        echo ""
        echo "🔑 Permission Analysis:"
        
        HAS_SPELLCHECK=false
        PERMISSION_SOURCE=""
        
        # Check permissions array
        if [ "$PERMISSIONS" != "" ] && [ "$PERMISSIONS" != "null" ]; then
            echo "   📋 Permissions: $PERMISSIONS"
            if echo "$PERMISSIONS" | grep -q "spellcheck\|administrator\|immigration_services_officer"; then
                HAS_SPELLCHECK=true
                PERMISSION_SOURCE="permissions"
            fi
        fi
        
        # Check roles array
        if [ "$ROLES" != "" ] && [ "$ROLES" != "null" ]; then
            echo "   👥 Roles: $ROLES"
            if echo "$ROLES" | grep -q "administrator\|immigration_services_officer"; then
                HAS_SPELLCHECK=true
                PERMISSION_SOURCE="roles"
            fi
        fi
        
        # Check user_attributes
        if [ "$USER_ATTRS" != "" ] && [ "$USER_ATTRS" != "null" ]; then
            echo "   📝 User Attributes: $USER_ATTRS"
            if echo "$USER_ATTRS" | grep -q "administrator\|immigration_services_officer\|Scribe"; then
                HAS_SPELLCHECK=true
                PERMISSION_SOURCE="user_attributes"
            fi
        fi
        
        if [ "$HAS_SPELLCHECK" = true ]; then
            echo "   ✅ HAS SPELLCHECK PERMISSIONS (from: $PERMISSION_SOURCE)"
        else
            echo "   ❌ LACKS SPELLCHECK PERMISSIONS"
            echo "   💡 Required: spellcheck, administrator, or immigration_services_officer"
        fi
        
    else
        echo "$DECODED_PAYLOAD"
        echo "💡 Install jq for detailed analysis: brew install jq"
    fi
else
    echo "❌ Could not decode payload"
    exit 1
fi

echo ""

# Test JWT Validator
echo "🧪 Testing JWT Validator"
echo "========================"

# Check if validator is running
if ! curl -s -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "❌ JWT Validator is not responding"
    echo "💡 Start it: cd jwt-validator && npm start"
    exit 1
fi

echo "✅ JWT Validator is running"

# Get validator info
VALIDATOR_INFO=$(curl -s http://localhost:3001/health 2>/dev/null)
if command -v jq >/dev/null 2>&1; then
    VALIDATOR_ALG=$(echo "$VALIDATOR_INFO" | jq -r '.algorithm // "unknown"' 2>/dev/null)
    KEY_SOURCE=$(echo "$VALIDATOR_INFO" | jq -r '.keySource // "unknown"' 2>/dev/null)
    echo "🔧 Validator Algorithm: $VALIDATOR_ALG"
    echo "🔑 Key Source: $KEY_SOURCE"
fi

echo ""
echo "🔍 Direct Token Validation Test..."

# Test the token
VALIDATION_RESULT=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST http://localhost:3001/validate \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$USER_TOKEN\"}" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to JWT validator"
    exit 1
fi

HTTP_CODE=$(echo "$VALIDATION_RESULT" | tail -n1 | sed 's/HTTP_CODE://')
RESPONSE_BODY=$(echo "$VALIDATION_RESULT" | sed '$d')

echo "📊 Validation Result:"
echo "   HTTP Status: $HTTP_CODE"
echo "   Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "🎉 SUCCESS! JWT Validator accepts your token!"
    echo ""
    echo "🧪 Testing Full Authentication Chain..."
    
    # Test nginx proxy
    NGINX_RESULT=$(curl -s -w "HTTP_CODE:%{http_code}" \
        -X POST http://localhost:8010/v2/check \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "text=This is a test with a mispelled word&language=en-US" 2>/dev/null)
    
    NGINX_CODE=$(echo "$NGINX_RESULT" | tail -n1 | sed 's/HTTP_CODE://')
    NGINX_BODY=$(echo "$NGINX_RESULT" | sed '$d')
    
    echo "🌐 nginx Proxy Test:"
    echo "   HTTP Status: $NGINX_CODE"
    
    if [ "$NGINX_CODE" = "200" ]; then
        echo "   ✅ FULL AUTHENTICATION SUCCESS!"
        echo ""
        echo "📊 LanguageTool Response:"
        if command -v jq >/dev/null 2>&1; then
            echo "$NGINX_BODY" | jq . 2>/dev/null || echo "$NGINX_BODY"
        else
            echo "$NGINX_BODY"
        fi
        echo ""
        echo "🎉 Your authentication is working perfectly!"
        echo "🔧 Use this endpoint in your frontend: http://localhost:8010/v2/check"
    else
        echo "   ❌ nginx proxy failed"
        echo "   Response: $NGINX_BODY"
        echo ""
        echo "💡 JWT validator works, but nginx has issues"
        echo "🔍 Check nginx logs: tail -f /tmp/nginx_languagetool_error.log"
    fi
    
else
    echo ""
    echo "❌ JWT Validator REJECTED your token"
    echo ""
    echo "🔍 Common causes:"
    case $HTTP_CODE in
        401)
            echo "   • Wrong public key for token verification"
            echo "   • Token signature invalid"
            echo "   • Token expired"
            ;;
        403)
            echo "   • Token lacks required permissions"
            echo "   • User not authorized for spellcheck"
            ;;
        *)
            echo "   • Server error or configuration issue"
            ;;
    esac
    
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Verify you have the correct RSA public key"
    echo "   2. Check token permissions above"
    echo "   3. View validator logs: tail -f logs/jwt-validator-debug.log"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo "   Token Algorithm: $ALG"
echo "   Validator Algorithm: $VALIDATOR_ALG"
echo "   Algorithm Match: $([ "$ALG" = "$VALIDATOR_ALG" ] && echo "✅ Yes" || echo "❌ No")"
echo "   Has Permissions: $([ "$HAS_SPELLCHECK" = true ] && echo "✅ Yes" || echo "❌ No")"
echo "   Token Expired: $([ "$EXP" != "unknown" ] && [ "$EXP" -lt "$(date +%s)" ] && echo "❌ Yes" || echo "✅ No")"
echo "   Validator Test: $([ "$HTTP_CODE" = "200" ] && echo "✅ Pass" || echo "❌ Fail ($HTTP_CODE)")"