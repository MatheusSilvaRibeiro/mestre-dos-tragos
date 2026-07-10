import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  clearMocks: true,
  restoreMocks: true,

  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.ts',
  ],

  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  collectCoverage: false,
 collectCoverageFrom: [
  'src/**/*.ts',

  // Testes
  '!src/tests/**',

  // Bootstrap da aplicação
  '!src/server.ts',

  // Configurações
  '!src/config/**',

  // Rotas
  '!src/routes/**',
  '!src/modules/**/dashboard.routes.ts',

  // Scripts utilitários
  '!src/scripts/**',

  // Tipagens
  '!src/types/**',
],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/tests/'],

  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90,
    },
  },
};

export default config;