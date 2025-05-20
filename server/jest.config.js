// Jest configuration file for the server.
// Configures how Jest runs tests in the server directory.

module.exports = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js'],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc' }]
      },
      setupFilesAfterEnv: ['./setupTests.js'],
      testPathIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['js', 'jsx', 'json']
    }
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000
};
