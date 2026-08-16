module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
          target: 'es2022',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
};