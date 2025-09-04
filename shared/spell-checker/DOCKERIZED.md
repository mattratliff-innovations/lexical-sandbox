# Complete Setup Guide - Option 1 (Separate Services)

## 📁 Final Project Structure

Here's what your project structure should look like after adding the Docker files:

```
your-project/
├── languagetool/
│   ├── Dockerfile                 # ← ADD THIS
│   └── (your existing LanguageTool files)
├── jwt-validator/
│   ├── Dockerfile                 # ← ADD THIS  
│   ├── package.json              # ← ADD THIS (if you don't have it)
│   ├── src/
│   │   └── index.js              # ← ADD THIS (or use your existing code)
│   └── (your existing JWT validator files)
├── nginx/
│   ├── Dockerfile                 # ← ADD THIS
│   ├── conf/
│   │   └── default.conf          # ← ADD THIS
│   └── (your existing nginx files)
├── docker-compose.yml             # ← ADD THIS
├── .env.example                   # ← ADD THIS
├── .env                           # ← CREATE THIS (copy from .env.example)
└── README.md                      # ← OPTIONAL
```

## 🚀 Setup Steps

### 1. Add the Docker Files

Place these files in your existing folders:

- **languagetool/Dockerfile** - Use the LanguageTool Dockerfile I provided
- **jwt-validator/Dockerfile** - Use the JWT Validator Dockerfile I provided  
- **nginx/Dockerfile** - Use the Nginx Dockerfile I provided
- **nginx/conf/default.conf** - Use the Nginx configuration I provided
- **docker-compose.yml** - Place this at your project root

### 2. Set Up JWT Validator (If You Don't Have It)

If you don't already have a JWT validator implementation:

- **jwt-validator/package.json** - Use the package.json I provided
- **jwt-validator/src/index.js** - Use the example implementation I provided

If you have existing JWT validator code, make sure your Dockerfile can build it properly.

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values
JWT_SECRET=your-actual-secret-key-here
JWT_ISSUER=your-application-name  
JWT_AUDIENCE=your-users
JAVA_OPTS=-Xmx2g
```

### 4. Build and Run

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check that everything is running
docker-compose ps
```

## 🧪 Testing Your Setup

### 1. Check Service Health

```bash
# Main health check
curl http://localhost:8080/health

# Individual service health (through proxy)
curl http://localhost:8080/auth/health
```

### 2. Test JWT Validation

```bash
# Test JWT validation endpoint
curl -X POST http://localhost:8080/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"your-test-jwt-token-here"}'
```

### 3. Test LanguageTool

```bash
# Test spell checking (requires valid JWT)
curl -X POST http://localhost:8080/v2/check \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Hello wrold&language=en-US"

# Test public endpoint (no auth needed)
curl http://localhost:8080/v2/languages
```

## 📋 API Endpoints

Your unified microservice will be available at `http://localhost:8080` with these endpoints:

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/health` | GET | No | Service health check |
| `/info` | GET | No | Service information |
| `/auth/validate` | POST | No | Validate JWT token |
| `/auth/decode` | POST | No | Decode JWT token (debug) |
| `/auth/health` | GET | No | JWT validator health |
| `/v2/check` | POST | Yes | Spell/grammar check |
| `/v2/languages` | GET | No | Get supported languages |

## 🔧 Customization

### If You Already Have Code

If you already have working implementations in your folders:

1. **LanguageTool folder**: Just add the Dockerfile I provided
2. **JWT Validator folder**: 
   - Add the Dockerfile I provided
   - Make sure your code listens on port 3000
   - Make sure it has a `/health` endpoint
3. **Nginx folder**: 
   - Add the Dockerfile and config I provided
   - Modify the config if you need custom routing

### Modifying Nginx Configuration

Edit `nginx/conf/default.conf` to customize:
- CORS headers
- Authentication logic  
- Routing rules
- Upstream server configurations

## 🐛 Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check logs
   docker-compose logs languagetool
   docker-compose logs jwt-validator
   docker-compose logs nginx-proxy
   ```

2. **Port conflicts**
   ```bash
   # Change the exposed port in docker-compose.yml
   ports:
     - "8081:80"  # Use 8081 instead of 8080
   ```

3. **JWT validation fails**
   - Check your JWT_SECRET, JWT_ISSUER, and JWT_AUDIENCE in .env
   - Make sure your JWT tokens are signed with the same secret

4. **CORS issues**
   - Check the nginx configuration
   - Make sure CORS headers are properly set

### Debug Commands

```bash
# Enter a running container
docker-compose exec jwt-validator /bin/sh
docker-compose exec nginx-proxy /bin/sh

# Check container logs
docker-compose logs -f nginx-proxy

# Restart a specific service
docker-compose restart languagetool
```

## 🎯 Next Steps

Once everything is running:

1. **Update your React app** to use `http://localhost:8080` as the base URL
2. **Test the integration** with your existing authentication
3. **Configure production settings** (HTTPS, proper secrets, etc.)
4. **Set up monitoring** and logging as needed

Your microservice is now ready to handle authenticated spell and grammar checking requests!