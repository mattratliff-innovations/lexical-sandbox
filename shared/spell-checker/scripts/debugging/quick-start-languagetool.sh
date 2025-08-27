#!/bin/bash

# Quick start LanguageTool with better error handling and reduced memory

echo "🚀 Quick Start LanguageTool Server"
echo "=================================="
echo ""

# Find the JAR
LANGUAGETOOL_JAR=""
if [ -f "languagetool/languagetool-server.jar" ]; then
    LANGUAGETOOL_JAR="languagetool/languagetool-server.jar"
elif [ -f "languagetool-server.jar" ]; then
    LANGUAGETOOL_JAR="languagetool-server.jar"
else
    echo "❌ LanguageTool JAR not found!"
    echo "Please ensure you have the JAR file in:"
    echo "  - ./languagetool/languagetool-server.jar"
    echo "  - ./languagetool-server.jar"
    exit 1
fi

echo "📦 Using JAR: $LANGUAGETOOL_JAR"

# Check if port is in use
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 8081 is in use. Stopping existing process..."
    LT_PID=$(lsof -t -i:8081)
    kill $LT_PID 2>/dev/null || true
    sleep 2
fi

# Create logs directory
mkdir -p logs

echo "🚀 Starting LanguageTool with reduced memory settings..."
echo "   Memory: 256MB initial, 1GB max (reduced from 2GB)"
echo "   Port: 8081"
echo "   Logs: logs/languagetool.log"
echo ""

# Start with reduced memory and more compatible settings
java -Xms256m -Xmx1g \
    -Djava.awt.headless=true \
    -Dfile.encoding=UTF-8 \
    -cp "$LANGUAGETOOL_JAR" \
    org.languagetool.server.HTTPServer \
    --port 8081 \
    --public \
    --allow-origin "*" \
    --maxTextLength 50000 \
    > logs/languagetool.log 2>&1 &

LT_PID=$!
echo $LT_PID > logs/languagetool.pid

echo "🔄 Started LanguageTool with PID: $LT_PID"
echo "📝 Monitoring startup (will wait up to 120 seconds)..."
echo ""

# Monitor startup with better feedback
for i in {1..120}; do
    # Check if process is still running
    if ! kill -0 "$LT_PID" 2>/dev/null; then
        echo ""
        echo "❌ LanguageTool process died after $i seconds!"
        echo "📋 Last few lines of log:"
        echo "---"
        tail -20 logs/languagetool.log | sed 's/^/   /'
        echo "---"
        rm -f logs/languagetool.pid
        exit 1
    fi
    
    # Check if it's responding (start checking after 10 seconds)
    if [ $i -gt 10 ]; then
        if curl -s -f http://localhost:8081/v2/check > /dev/null 2>&1; then
            echo ""
            echo "✅ LanguageTool is ready and responding!"
            echo "🌐 Available at: http://localhost:8081/v2/check"
            echo "📊 PID: $LT_PID"
            echo ""
            
            # Test it quickly
            echo "🧪 Quick test..."
            RESPONSE=$(curl -s -X POST \
                -H "Content-Type: application/x-www-form-urlencoded" \
                -d "text=This is a test&language=en-US" \
                http://localhost:8081/v2/check 2>/dev/null || echo "ERROR")
                
            if [[ "$RESPONSE" == *"matches"* ]]; then
                echo "✅ Test successful - LanguageTool is working!"
            else
                echo "⚠️  Test response unexpected: ${RESPONSE:0:100}..."
            fi
            
            echo ""
            echo "📋 Management commands:"
            echo "   Stop: kill $LT_PID"
            echo "   Logs: tail -f logs/languagetool.log"
            echo "   Status: curl http://localhost:8081/v2/check"
            
            exit 0
        fi
    fi
    
    # Progress indicator
    if [ $((i % 10)) -eq 0 ]; then
        echo "⏳ Still starting... ($i seconds elapsed)"
        echo "📋 Recent log activity:"
        tail -3 logs/languagetool.log | sed 's/^/   /' || echo "   (no log output yet)"
    else
        echo -n "."
    fi
    
    sleep 1
done

echo ""
echo "❌ LanguageTool failed to start within 120 seconds"
echo "📋 Current log contents:"
echo "---"
cat logs/languagetool.log | sed 's/^/   /'
echo "---"

echo ""
echo "💡 Troubleshooting:"
echo "1. Check if you have enough memory available"
echo "2. Try starting manually: java -cp '$LANGUAGETOOL_JAR' org.languagetool.server.HTTPServer --port 8081"
echo "3. Check Java version compatibility (Java 11 or 17 recommended)"

# Clean up PID file
rm -f logs/languagetool.pid

if kill -0 "$LT_PID" 2>/dev/null; then
    echo "4. Process is still running with PID $LT_PID - you may want to kill it"
fi