# LanguageTool Service Dockerfile - Using Java 21 (Latest)
FROM openjdk:21-jre-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create LanguageTool directory
RUN mkdir -p languagetool

# Copy your local LanguageTool files
COPY . ./languagetool/

# Debug: Show Java version and JAR files
RUN echo "=== Docker Build Info ===" && \
    echo "Java version:" && \
    java -version && \
    echo "Looking for LanguageTool JAR files:" && \
    find ./languagetool -name "*.jar" -type f -exec echo "Found: {}" \; && \
    echo "=========================="

# Create cache directory
RUN mkdir -p /app/cache

# Create startup script that finds the correct JAR
RUN echo '#!/bin/bash' > start-languagetool.sh && \
    echo 'set -e' >> start-languagetool.sh && \
    echo 'echo "=== LanguageTool Startup ==="' >> start-languagetool.sh && \
    echo 'echo "Java version:"' >> start-languagetool.sh && \
    echo 'java -version' >> start-languagetool.sh && \
    echo 'echo "Searching for LanguageTool JAR..."' >> start-languagetool.sh && \
    echo 'JAR_FILE=$(find /app/languagetool -name "*languagetool*server*.jar" -o -name "*languagetool*.jar" -o -name "*.jar" | grep -i languagetool | head -1)' >> start-languagetool.sh && \
    echo 'if [ -z "$JAR_FILE" ]; then' >> start-languagetool.sh && \
    echo '  echo "ERROR: LanguageTool JAR not found!"' >> start-languagetool.sh && \
    echo '  echo "Available files in /app/languagetool:"' >> start-languagetool.sh && \
    echo '  ls -la /app/languagetool/' >> start-languagetool.sh && \
    echo '  echo "All JAR files found:"' >> start-languagetool.sh && \
    echo '  find /app/languagetool -name "*.jar" -type f' >> start-languagetool.sh && \
    echo '  exit 1' >> start-languagetool.sh && \
    echo 'fi' >> start-languagetool.sh && \
    echo 'echo "Using JAR file: $JAR_FILE"' >> start-languagetool.sh && \
    echo 'echo "Starting LanguageTool server on port 8010..."' >> start-languagetool.sh && \
    echo 'java ${JAVA_OPTS:--Xmx2g} -cp "$JAR_FILE" org.languagetool.server.HTTPServer --port 8010 --allow-origin "*" --public' >> start-languagetool.sh && \
    chmod +x start-languagetool.sh

# Create non-root user for security
RUN groupadd -r languagetool && useradd -r -g languagetool languagetool
RUN chown -R languagetool:languagetool /app
USER languagetool

# Expose LanguageTool port
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8010/v2/languages || exit 1

# Start LanguageTool server using the startup script
CMD ["./start-languagetool.sh"]