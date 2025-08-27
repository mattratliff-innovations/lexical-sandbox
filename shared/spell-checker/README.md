# Manual Setup Instructions

## Prereqs

Note: There are known compatibility issues with Java 24.  Please use Java 17.

## Quick Start

1. **Create directory structure:**
   ```bash
   mkdir languagetool-manual && cd languagetool-manual
   mkdir -p jwt-validator nginx scripts logs
   ```

2. **Set up JWT Validator:**
   ```bash
   cd jwt-validator
   # Copy package.json and server.js from artifacts
   # Create .env file with your JWT secret
   npm install
   cd ..
   ```

3. **Add your LanguageTool JAR:**
   ```bash
   # Copy your LanguageTool JAR to the root directory
   cp /path/to/languagetool-server.jar ./
   ```

4. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

5. **Start all services:**
   ```bash
   ./scripts/start-all.sh
   ```

## Step-by-Step Setup

### 1. JWT Validator Setup
```bash
cd jwt-validator
npm install
# Edit .env file - set your JWT_SECRET to match your app
NODE_ENV=development npm start
```

### 2. LanguageTool Setup
```bash
# In a separate terminal
java -Xms512m -Xmx2g -cp languagetool-server.jar \
  org.languagetool.server.HTTPServer \
  --port 8081 \
  --public \
  --allow-origin "*"
```

### 3. nginx Setup (Optional)
```bash
# Test configuration
nginx -t -c /path/to/your/nginx.conf

# Start nginx
sudo nginx -c /path/to/your/nginx.conf
```

## Testing

### Generate Test Token
```bash
curl -X POST http://localhost:3001/generate-test-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","permissions":["spellcheck"]}'
```

### Test Authentication
```bash
# Without authentication (should fail with nginx)
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8010/v2/check
```
Expected Output: {"error":"Authentication required","code":"AUTHENTICATION_REQUIRED"}%          

```bash
# With valid token (should succeed)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Test with mispelled word&language=en-US" \
  http://localhost:8010/v2/check
```

## Service URLs

- **JWT Validator**: http://localhost:3001
- **LanguageTool (direct)**: http://localhost:8081/v2/check
- **Authenticated API**: http://localhost:8010/v2/check (with nginx)

## Management Commands

```bash
# Start all services
./scripts/start-all.sh

# Stop all services  
./scripts/stop-all.sh

# Test authentication
./scripts/test-auth.sh

# View logs
tail -f logs/*.log

# Check service status
curl http://localhost:3001/health
curl http://localhost:8081/v2/check
curl http://localhost:8010/health
```

## Environment Variables

### jwt-validator/.env
```bash
JWT_SECRET=your-secret-key-must-match-your-main-app
NODE_ENV=development
PORT=3001
```

## Troubleshooting

### Port conflicts
```bash
# Check what's using a port
lsof -i :3001
lsof -i :8081  
lsof -i :8010

# Kill process using port
kill $(lsof -t -i:3001)
```

### Logs
```bash
# JWT Validator logs
tail -f logs/jwt-validator.log

# LanguageTool logs  
tail -f logs/languagetool.log

# nginx logs (system location)
tail -f /var/log/nginx/languagetool_access.log
tail -f /var/log/nginx/languagetool_error.log
```

### Common Issues
1. **JWT secret mismatch**: Make sure JWT_SECRET in .env matches your main app
2. **LanguageTool JAR not found**: Ensure the JAR path is correct
3. **Port already in use**: Stop conflicting services or change ports
4. **nginx permission denied**: Run nginx commands with sudo