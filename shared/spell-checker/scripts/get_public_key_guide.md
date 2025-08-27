# How to Get Your RSA Public Key

Since your main application uses RS256, you need the **RSA public key** that corresponds to the private key used to sign the tokens.

## Method 1: Ask Your Backend Team

**Best approach** - Ask your backend/DevOps team for:

```
"I need the RSA public key for JWT token verification. 
The tokens are signed with RS256 algorithm. 
Please provide either:
1. The public key in PEM format, OR
2. The JWKS URL endpoint"
```

## Method 2: Check Your App's OIDC Configuration

If your app uses OIDC/OAuth2, find the configuration endpoint:

```bash
# Common OIDC endpoints
curl https://your-auth-server.com/.well-known/openid_configuration

# Look for "jwks_uri" in the response
# Example: "jwks_uri": "https://your-auth-server.com/.well-known/jwks.json"
```

## Method 3: Extract from Browser Network Tab

1. Open your app in browser
2. Open Developer Tools → Network tab
3. Look for calls to JWKS endpoints (usually contain "jwks" or "keys")
4. The response will contain the public keys

## Method 4: Check Environment Variables

Your main application might have these environment variables:

```bash
# Look for variables like:
JWT_PUBLIC_KEY
RSA_PUBLIC_KEY
JWKS_URI
OIDC_JWKS_URL
AUTH_PUBLIC_KEY
```

## Expected Public Key Format

**PEM Format** (most common):
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef...
...more base64 encoded content...
-----END PUBLIC KEY-----
```

**JWKS Format** (JSON Web Key Set):
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-1",
      "use": "sig",
      "alg": "RS256",
      "n": "base64-encoded-modulus",
      "e": "AQAB"
    }
  ]
}
```

## Once You Have the Key

Run the setup script:

```bash
chmod +x setup-rs256-jwt.sh
./setup-rs256-jwt.sh
```

Choose the appropriate option:
- **Option 1**: Paste PEM key directly
- **Option 2**: Provide JWKS URL (recommended for production)
- **Option 3**: Load from existing file

## Testing

After setup, test with:

```bash
# Check if validator is working
curl http://localhost:3001/health

# Test with your actual token
curl -X POST http://localhost:8010/v2/check \
  -H "Authorization: Bearer YOUR_ACTUAL_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US"
```

The key point is that **you need the same public key that corresponds to the private key your main application uses to sign JWT tokens**.
