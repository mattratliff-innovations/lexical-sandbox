# LanguageTool Service Dockerfile
FROM openjdk:8-jre-slim

# Install curl for health checks and unzip for extracting LanguageTool
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Download and install LanguageTool
ARG LANGUAGETOOL_VERSION=6.4
RUN curl -L https://github.com/languagetool-org/languagetool/releases/download/v${LANGUAGETOOL_VERSION}/LanguageTool-${LANGUAGETOOL_VERSION}.zip -o languagetool.zip && \
    unzip languagetool.zip && \
    mv LanguageTool-${LANGUAGETOOL_VERSION} languagetool && \
    rm languagetool.zip

# Copy any custom LanguageTool configuration if you have it
# COPY config/ /app/languagetool/config/

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
CMD ["java", "-cp", "languagetool/languagetool-server.jar", "org.languagetool.server.HTTPServer", "--port", "8010", "--allow-origin", "*", "--public"]