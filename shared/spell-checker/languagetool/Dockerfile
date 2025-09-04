# LanguageTool Service Dockerfile - Simplified Ubuntu Java Base 21
FROM ubuntu-java-base:21

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your local LanguageTool files
COPY . ./

# Verify Java and JAR file
RUN echo "Java version:" && java -version && \
    echo "Looking for JAR files:" && \
    find . -name "*.jar" -type f

# Create cache directory
RUN mkdir -p /app/cache

# Create non-root user
RUN groupadd -r languagetool && useradd -r -g languagetool languagetool && \
    chown -R languagetool:languagetool /app

USER languagetool

# Expose LanguageTool port
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8010/v2/languages || exit 1

# Start LanguageTool server directly
# Adjust the JAR file name to match your actual file
CMD ["java", "-Xmx2g", "-cp", "languagetool-server.jar", "org.languagetool.server.HTTPServer", "--port", "8010", "--allow-origin", "*", "--public"]