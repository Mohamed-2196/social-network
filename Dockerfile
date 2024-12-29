# Use a more recent Node.js runtime as a parent image
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the app for production
RUN npm run build

# Use a lightweight web server to serve the app
FROM nginx:alpine

# Copy built assets from the builder stage
COPY --from=builder /app /usr/share/nginx/html

# Expose the port the app runs on
EXPOSE 3000

# Command to run the nginx server
CMD ["nginx", "-g", "daemon off;"]