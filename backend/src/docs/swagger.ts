import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mestre dos Tragos API',
      version: '1.0.0',
      description: 'Documentação da API do sistema Mestre dos Tragos.',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['src/routes/*.ts', 'src/modules/**/*.routes.ts'],
});