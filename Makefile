.PHONY: test test-client test-server build build-client build-server install install-client install-server

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

# Run client tests in watch mode
test-client-watch:
	cd client && npm test -- --watch

# Run server tests in watch mode
test-server-watch:
	cd server && npm run test:watch
