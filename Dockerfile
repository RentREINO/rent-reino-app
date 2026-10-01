
FROM node:22-alpine

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy dependency files first for Docker cache
COPY --chown=app:app package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY --chown=app:app . .

# Make sure app user owns the application directory 
RUN chown -R app:app /app

USER app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
