# Authentication Testing Guide

## What's Happening

Your curl command:
```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8081/v2/check
```

Is going **directly** to LanguageTool, bypassing authentication entirely.

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Client   │    │   JWT Validator │    │  LanguageTool   │
│                 │    │   Port 3001     │    │   Port 8081     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────▶│ nginx Proxy     │──────────────┘
                        │ Port 8010       │
                        │ (with auth)     │
                        └─────────────────┘
```

## Port Explanation

- **8081** = Direct LanguageTool (no authentication)
- **8010** = nginx proxy (with JWT authentication) 
- **3001** = JWT validator service

## Testing Authentication

### 1. Test WITHOUT nginx (current setup)
If you're not running nginx, authentication is **not enforced**:

```bash
# This works because there's no authentication layer
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8081/v2/check
```

### 2. Test WITH nginx (authenticated setup)
First, start nginx, then:

```bash
# This should FAIL (401 Unauthorized)
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8010/v2/check

# This should SUCCEED (with valid token)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8010/v2/check
```
