.PHONY: test test-client test-server build build-client build-server install install-client install-server start start-client start-server

# Build everything
build: build-client build-server

# Build client
build-client:
	cd client && npm run build

# Build server
build-server:
	cd server && npm install

# Install all dependencies
install: install-client install-server

# Install client dependencies
install-client:
	cd client && npm install

# Install server dependencies
install-server:
	cd server && npm install

# Run all tests
test: test-client test-server

# Run client tests
test-client:
	cd client && npm test

# Run server tests
test-server:
	cd server && npm test

# Start everything
start: start-server start-client

# Start client
start-client:
	cd client && npm start

# Start server
start-server:
	cd server && npm start
