#!/bin/bash

# Debug JWT algorithm issues

echo "🔍 JWT Algorithm Debug Tool"
echo "==========================="
echo ""

# Check if we can get a token from the main app
echo "📋 Step 1: Analyzing JWT Token Structure"
echo ""

# Try to get token from browser storage (if available)
echo "💡 To get your JWT token, run this in your browser console:"
echo "   console.log('Token:', localStorage.getItem('id_token'));"
echo "   // or"
echo "   console.log('Token:', localStorage.getItem('access_token'));"
echo "   // or check other storage keys your app uses"
echo ""

read -p "Paste your JWT token here: " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "🔍 Analyzing Token Structure..."

# Extract header and payload
HEADER=$(echo "$JWT_TOKEN" | cut -d'.' -f1)
PAYLOAD=$(echo "$JWT_TOKEN" | cut -d'.' -f2)

# Add padding if needed for base64 decoding
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

echo ""
echo "📋 JWT Header:"
echo "=============="
DECODED_HEADER=$(echo "$HEADER_PADDED" | base64 -d 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$DECODED_HEADER" | jq . 2>/dev/null || echo "$DECODED_HEADER"
    
    # Extract algorithm
    ALGORITHM=$(echo "$DECODED_HEADER" | jq -r '.alg' 2>/dev/null || echo "unknown")
    echo ""
    echo "🔧 Detected Algorithm: $ALGORITHM"
else
    echo "❌ Could not decode header"
    exit 1
fi

echo ""
echo "📋 JWT Payload:"
echo "==============="
DECODED_PAYLOAD=$(echo "$PAYLOAD_PADDED" | base64 -d 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$DECODED_PAYLOAD" | jq . 2>/dev/null || echo "$DECODED_PAYLOAD"
    
    # Extract key info
    USER_ID=$(echo "$DECODED_PAYLOAD" | jq -r '.userId // .sub // .user_id // "unknown"' 2>/dev/null)
    PERMISSIONS=$(echo "$DECODED_PAYLOAD" | jq -r '.permissions // []' 2>/dev/null)
    EXPIRY=$(echo "$DECODED_PAYLOAD" | jq -r '.exp // "unknown"' 2>/dev/null)
    
    echo ""
    echo "👤 User ID: $USER_ID"
    echo "🔑 Permissions: $PERMISSIONS"
    echo "⏰ Expires: $EXPIRY"
else
    echo "❌ Could not decode payload"
    exit 1
fi

echo ""
echo "🔍 Algorithm Compatibility Check:"
echo "=================================="

case $ALGORITHM in
    "HS256")
        echo "✅ HS256 (HMAC SHA-256) - Should work with JWT library"
        echo "🔧 Uses symmetric key (shared secret)"
        COMPATIBLE=true
        ;;
    "HS384")
        echo "✅ HS384 (HMAC SHA-384) - Should work with JWT library"  
        echo "🔧 Uses symmetric key (shared secret)"
        COMPATIBLE=true
        ;;
    "HS512")
        echo "✅ HS512 (HMAC SHA-512) - Should work with JWT library"
        echo "🔧 Uses symmetric key (shared secret)"
        COMPATIBLE=true
        ;;
    "RS256")
        echo "⚠️  RS256 (RSA SHA-256) - Requires RSA public key"
        echo "🔧 Uses asymmetric key (public/private key pair)"
        COMPATIBLE=false
        ;;
    "RS384")
        echo "⚠️  RS384 (RSA SHA-384) - Requires RSA public key"
        echo "🔧 Uses asymmetric key (public/private key pair)"
        COMPATIBLE=false
        ;;
    "RS512")
        echo "⚠️  RS512 (RSA SHA-512) - Requires RSA public key"
        echo "🔧 Uses asymmetric key (public/private key pair)"
        COMPATIBLE=false
        ;;
    "ES256")
        echo "⚠️  ES256 (ECDSA SHA-256) - Requires ECDSA public key"
        echo "🔧 Uses elliptic curve keys"
        COMPATIBLE=false
        ;;
    *)
        echo "❓ Unknown algorithm: $ALGORITHM"
        COMPATIBLE=false
        ;;
esac

echo ""
echo "🔧 Solution:"
echo "============"

if [ "$COMPATIBLE" = true ]; then
    echo "✅ Algorithm is compatible!"
    echo ""
    echo "The issue is likely:"
    echo "1. JWT_SECRET mismatch between your main app and jwt-validator"
    echo "2. Different algorithm specification in verification"
    echo ""
    echo "🔧 Fix steps:"
    echo "1. Verify JWT_SECRET in jwt-validator/.env matches your main app"
    echo "2. Update jwt-validator to explicitly specify algorithm"
    echo ""
    echo "Run this to update your JWT validator:"
    echo "  ./fix-jwt-algorithm.sh $ALGORITHM"
else
    echo "❌ Algorithm requires additional setup!"
    echo ""
    echo "Your main app uses $ALGORITHM which requires:"
    
    case $ALGORITHM in
        "RS"*)
            echo "• RSA public key for verification"
            echo "• Different verification method"
            ;;
        "ES"*)
            echo "• ECDSA public key for verification"  
            echo "• Different verification method"
            ;;
    esac
    
    echo ""
    echo "🔧 Options:"
    echo "1. Configure jwt-validator for $ALGORITHM (complex)"
    echo "2. Ask your main app team to also issue HS256 tokens for spell check"
    echo "3. Use a different authentication approach"
    echo ""
    echo "Run this for $ALGORITHM setup:"
    echo "  ./setup-asymmetric-jwt.sh $ALGORITHM"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Verify JWT_SECRET matches your main application"
echo "2. Update jwt-validator algorithm handling"
echo "3. Test with updated validator"
echo ""
echo "Current JWT_SECRET in jwt-validator/.env:"
if [ -f "jwt-validator/.env" ]; then
    grep "JWT_SECRET" jwt-validator/.env | head -1
else
    echo "❌ No .env file found in jwt-validator/"
fi