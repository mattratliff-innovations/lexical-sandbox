# LanguageTool Service Dockerfile - Copy Entire Local Installation
FROM openjdk:8-jre-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your entire LanguageTool installation
# This assumes you have a complete LanguageTool folder structure
COPY . ./languagetool/

# Ensure the JAR file is executable and in the right location
# Adjust the path based on your actual LanguageTool structure
RUN find ./languagetool -name "languagetool-server.jar" -type f

# Create cache directory
RUN mkdir -p /app/cache

# Create non-root user for security
RUN groupadd -r languagetool && useradd -r -g languagetool languagetool
RUN chown -R languagetool:languagetool /app
USER languagetool

# Expose LanguageTool port
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8010/v2/languages || exit 1

# Start LanguageTool server
# Adjust the path to match where your languagetool-server.jar is located
CMD ["java", "-cp", "languagetool/languagetool-server.jar", "org.languagetool.server.HTTPServer", "--port", "8010", "--allow-origin", "*", "--public"]