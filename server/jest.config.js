module.exports = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/*.test.js'],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc' }]
      },
      setupFilesAfterEnv: ['./setupTests.js'],
      testPathIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['js', 'jsx', 'json']
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['**/tests/unit/onboardingAuthenticationUI.test.js'],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc' }]
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
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
