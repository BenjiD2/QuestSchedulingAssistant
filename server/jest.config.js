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
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    // ← new lines below
    '^react$': '<rootDir>/../client/node_modules/react',
    '^react-dom$': '<rootDir>/../client/node_modules/react-dom'
  },
  setupFilesAfterEnv: ['./setupTests.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(?:.+/)?client/src).+\\.js$'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  testEnvironment: 'jsdom'
};
