# Use a specific Node.js Alpine version
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install necessary build tools and dependencies for sharp
RUN apk add --no-cache \
    vips-dev \
    build-base \
    gcc \
    g++ \
    make \
    python3\
    curl

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Upgrade npm to the latest version
RUN npm install -g npm@latest

# Install application dependencies
RUN npm install --libc=musl --include=optional sharp puppeteer

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Start the app
CMD ["npm", "run", "start:dev"]