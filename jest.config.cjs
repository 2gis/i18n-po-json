/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false,
  testPathIgnorePatterns: ['dist/.*'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
  },
};