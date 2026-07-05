import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  clearMocks: true,
  restoreMocks: true,

  // Onde o Jest procura os testes
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/__tests__/**/*.ts'],

  // Roda antes de cada arquivo de teste (ex: variáveis de ambiente de teste)
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  collectCoverage: false, // ligue com --coverage quando quiser o relatório
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/tests/'],
};

export default config;
