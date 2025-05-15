# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the application
COPY . .

# Build TypeScript if needed (optional if you use ts-node)
# RUN npm run build

# Expose a port if your SMPP server listens on one (optional)
EXPOSE 2775

# Run the server using ts-node
CMD ["npx", "ts-node", "smpp-core/smpp-server.ts"]
