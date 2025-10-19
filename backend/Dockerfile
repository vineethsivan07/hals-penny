# Production Dockerfile for HAL's Penny
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S halspenny -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=halspenny:nodejs /app/src ./src
COPY --from=builder --chown=halspenny:nodejs /app/frontend/build ./public
COPY --from=builder --chown=halspenny:nodejs /app/database.js ./
COPY --from=builder --chown=halspenny:nodejs /app/anthropic-service.js ./
COPY --from=builder --chown=halspenny:nodejs /app/openai-service.js ./
COPY --from=builder --chown=halspenny:nodejs /app/swagger.yaml ./

# Create logs directory
RUN mkdir -p logs && chown halspenny:nodejs logs

# Create uploads directory
RUN mkdir -p uploads && chown halspenny:nodejs uploads

# Switch to non-root user
USER halspenny

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "src/server.js"]
