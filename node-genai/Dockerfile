FROM node:20-alpine

WORKDIR /app

# Copy package files for main app
COPY package*.json ./

# Install main app dependencies
RUN npm install

# Copy application code
COPY . .

# Install Astro dependencies and build
WORKDIR /app/astro-app
RUN npm install
RUN npm run build

# Go back to main app directory
WORKDIR /app

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["node", "app.js"]