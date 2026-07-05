import dotenv from 'dotenv';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Carrega variáveis de um .env.test separado, se existir — senão cai no .env normal.
// Isso evita que os testes acidentalmente batam no banco de desenvolvimento/produção.
dotenv.config({ path: '.env.test' });


