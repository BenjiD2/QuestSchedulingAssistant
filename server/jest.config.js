module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx'],
  setupFilesAfterEnv: ['./setupTests.js'],
  transformIgnorePatterns: [
    // Allow transpilation of client/src files for tests
    '/node_modules/(?!(?:.+/)?client/src).+\\.js$'
  ],
}; 