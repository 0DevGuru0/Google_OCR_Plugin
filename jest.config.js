module.exports = {
  moduleFileExtensions: ['js'],
  setupFiles: ['dotenv/config'],
  testEnvironment: 'node',
  // all integration tests go to /test directory
  testRegex: '\\.test\\.js$',
  watchPlugins: [
    [
      'jest-watch-typeahead/filename',
      {
        // Override jest default filtering by filename regex pattern
        key: 'p',
        promot: 'filter by a filename regex pattern',
      },
    ],
    [
      'jest-watch-typeahead/testname',
      {
        // Override jest default filtering by test name regex pattern
        key: 't',
        promot: 'filter by a test name regex pattern',
      },
    ],
  ],
  cacheDirectory: '/tmp/jest-cache',
};
