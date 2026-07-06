# Mestre dos Tragos

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-Tests-C21325?style=for-the-badge&logo=jest&logoColor=white)

Sistema web full stack para gestão operacional de lancherias, bares e pequenos restaurantes, com atendimento, painel de cozinha em tempo real, gestão de cardápio, controle de funcionários, relatórios e dashboard administrativo.

O projeto foi desenvolvido com foco em organização, segurança, qualidade de código e práticas profissionais de engenharia de software, incluindo TypeScript, Prisma, autenticação JWT, WebSocket, testes automatizados, cobertura de código, CI/CD, Swagger, Zod, Helmet, Rate Limit e Git Flow.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Perfis de acesso](#perfis-de-acesso)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do backend](#configuração-do-backend)
- [Configuração do frontend](#configuração-do-frontend)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes e cobertura](#testes-e-cobertura)
- [Documentação da API](#documentação-da-api)
- [Segurança](#segurança)
- [Banco de dados](#banco-de-dados)
- [Fluxo Git](#fluxo-git)
- [CI/CD](#cicd)
- [Roadmap](#roadmap)
- [Autor](#autor)

---

## Sobre o projeto

O **Mestre dos Tragos** é uma aplicação para apoiar a operação diária de estabelecimentos alimentícios. A proposta é centralizar o fluxo de pedidos, cardápio, cozinha, funcionários e indicadores em uma plataforma única.

O sistema foi pensado para três momentos principais da operação:

1. **Atendimento**: montagem de pedidos com produtos, tamanhos, adicionais, sabores e observações.
2. **Cozinha**: acompanhamento dos pedidos em tempo real por status operacional.
3. **Administração**: gestão de cardápio, funcionários, dashboard e relatórios.

---

## Funcionalidades

### Atendimento

- Listagem de produtos disponíveis.
- Filtro por categorias.
- Carrinho de pedidos.
- Seleção de tamanhos.
- Seleção de adicionais.
- Observações por item e por pedido.
- Consulta de pedidos.

### Cozinha

- Painel em tempo real com WebSocket.
- Visualização dos pedidos por status.
- Atualização do andamento do pedido.
- Destaque visual para acompanhamento operacional.

### Administração

- Dashboard com métricas operacionais.
- Gestão de produtos.
- Gestão de categorias.
- Gestão de adicionais.
- Gestão de funcionários.
- Histórico de pedidos.
- Relatórios por período, status, produto e atendente.

### Autenticação e autorização

- Login com JWT.
- Controle de acesso por perfil.
- Rotas protegidas.
- Controle de permissões por função.

---

## Perfis de acesso

| Perfil | Permissões principais |
|---|---|
| `ADMIN` | Acesso total ao sistema, dashboard, relatórios, cardápio e funcionários. |
| `ATENDENTE` | Criação e acompanhamento de pedidos. |
| `COZINHA` | Visualização e atualização de pedidos na cozinha. |

---

## Arquitetura

O projeto está organizado como uma aplicação full stack separada em dois módulos principais:

```text
mestre-dos-tragos/
├── backend/                  # API Node.js + Express + Prisma
├── mestre-dos-tragos-web/    # Frontend React + Vite
├── .github/                  # Workflows de CI
├── .gitignore
└── README.md
```

### Backend

O backend utiliza Express com TypeScript, Prisma ORM e PostgreSQL. Ele organiza a aplicação em camadas:

```text
backend/src/
├── config/          # Configuração do Prisma e Socket.IO
├── controllers/     # Controllers da API
├── docs/            # Configuração do Swagger
├── middlewares/     # Autenticação, autorização, erros e rate limit
├── modules/         # Módulos específicos, como dashboard
├── routes/          # Rotas HTTP
├── tests/           # Testes automatizados
├── types/           # Tipagens globais
├── validators/      # Schemas Zod
└── server.ts        # Inicialização da aplicação
```

### Frontend

O frontend utiliza React, TypeScript e Vite. A aplicação está organizada por páginas e componentes:

```text
mestre-dos-tragos-web/src/
├── components/      # Componentes reutilizáveis
├── context/         # Contextos globais, como autenticação
├── pages/           # Telas da aplicação
├── services/        # Integração com API
├── styles/          # Estilos globais e tema
├── App.tsx
└── main.tsx
```

---

## Tecnologias

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- JWT
- bcrypt
- Zod
- Swagger
- Helmet
- Compression
- Express Rate Limit
- Jest
- Supertest
- ESLint

### Frontend

- React
- TypeScript
- Vite
- React Router DOM
- Axios
- Socket.IO Client
- ESLint

### DevOps e qualidade

- GitHub Actions
- Git Flow
- Branch Protection
- Testes automatizados
- Relatório de cobertura
- CI com lint, typecheck, testes e build

---

## Pré-requisitos

Antes de executar o projeto, instale:

- Node.js 20 ou superior
- npm
- PostgreSQL
- Git

---

## Configuração do backend

Acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no exemplo:

```bash
cp .env.example .env
```

Exemplo de variáveis:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mestre_dos_tragos?schema=public"
JWT_SECRET="seu_secret_aqui"
PORT=3333
FRONTEND_URL="http://localhost:5173"
```

Execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

Gere o Prisma Client:

```bash
npx prisma generate
```

Inicie o backend em desenvolvimento:

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3333
```

---

## Configuração do frontend

Acesse a pasta do frontend:

```bash
cd mestre-dos-tragos-web
```

Instale as dependências:

```bash
npm install
```

Inicie o frontend:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

---

## Scripts disponíveis

### Backend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o backend em modo desenvolvimento. |
| `npm run build` | Gera o Prisma Client e compila o TypeScript. |
| `npm run start` | Executa a versão compilada em `dist`. |
| `npm run lint` | Executa o ESLint. |
| `npm run lint:fix` | Executa o ESLint com correção automática. |
| `npm run typecheck` | Executa verificação de tipos com TypeScript. |
| `npm run test` | Executa os testes com Jest. |
| `npm run test:watch` | Executa os testes em modo observação. |
| `npm run test:coverage` | Executa testes com relatório de cobertura. |

### Frontend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o Vite em desenvolvimento. |
| `npm run build` | Compila TypeScript e gera build de produção. |
| `npm run lint` | Executa o ESLint. |
| `npm run preview` | Pré-visualiza o build localmente. |

---

## Testes e cobertura

O backend possui uma suíte automatizada com Jest e Supertest.

Para executar os testes:

```bash
cd backend
npm run test
```

Para gerar relatório de cobertura:

```bash
npm run test:coverage
```

Estado atual da suíte:

- 13 suítes de testes.
- 177 testes automatizados.
- Cobertura global superior a 94%.
- Middlewares críticos cobertos.
- Controllers principais cobertos.

A cobertura mínima global é controlada no `jest.config.ts`.

---

## Documentação da API

A API possui documentação inicial com Swagger.

Com o backend rodando, acesse:

```text
http://localhost:3333/api-docs
```

A documentação está configurada em:

```text
backend/src/docs/swagger.ts
```

---

## Segurança

O backend possui uma camada inicial de hardening para produção:

- **Helmet** para cabeçalhos HTTP de segurança.
- **CORS** configurado por origem permitida.
- **Compression** para compressão de respostas.
- **Rate Limit global** para reduzir abuso da API.
- **Rate Limit específico no login** contra força bruta.
- **JWT** para autenticação.
- **bcrypt** para hash de senhas.
- **Zod** para validação de entradas.
- **Controle de acesso por role** com middleware dedicado.

---

## Banco de dados

O projeto utiliza Prisma ORM com PostgreSQL.

Principais entidades:

- `Usuario`
- `Categoria`
- `Produto`
- `ProdutoTamanho`
- `Adicional`
- `AdicionalTamanho`
- `ProdutoAdicional`
- `Pedido`
- `ItemPedido`
- `ItemPedidoAdicional`
- `ItemPedidoSabor`

Enums principais:

- `Role`: `ADMIN`, `ATENDENTE`, `COZINHA`
- `StatusPedido`: `PENDENTE`, `EM_PREPARO`, `PRONTO`, `ENTREGUE`, `CANCELADO`
- `TipoProduto`: `LANCHE`, `BATATA_FRITA`, `PORCAO_MISTA`
- `Tamanho`: `P`, `M`, `G`

---

## Fluxo Git

O projeto utiliza um fluxo baseado em Git Flow:

```text
main       # versão estável
   ↑
develop    # integração das features
   ↑
feature/*  # novas funcionalidades
fix/*      # correções
chore/*    # manutenção
refactor/* # refatorações
docs/*     # documentação
security/* # melhorias de segurança
```

Fluxo recomendado:

1. Criar branch a partir de `develop`.
2. Desenvolver a alteração.
3. Rodar validações locais.
4. Abrir Pull Request para `develop`.
5. Aguardar CI passar.
6. Fazer merge.
7. Promover `develop` para `main` apenas em releases estáveis.

---

## CI/CD

O projeto utiliza GitHub Actions para validação automática.

Validações do backend:

- Instalação de dependências.
- ESLint.
- Typecheck.
- Testes automatizados.
- Build.

Validações do frontend:

- Instalação de dependências.
- ESLint.
- Build.

A recomendação é manter Pull Requests pequenos e com objetivo único.

---

## Roadmap

### Concluído

- Estrutura full stack.
- Autenticação JWT.
- Controle de perfis.
- Painel de atendimento.
- Painel da cozinha.
- Dashboard administrativo.
- Gestão de cardápio.
- Gestão de funcionários.
- Relatórios.
- WebSocket.
- Testes automatizados.
- Cobertura de testes.
- Swagger.
- Hardening inicial de segurança.
- Validação com Zod.
- CI/CD.
- Branch Protection.

### Próximas melhorias sugeridas

- README com screenshots reais.
- Docker e Docker Compose.
- CodeQL.
- Dependabot.
- Logs estruturados com Pino ou Winston.
- Testes E2E com Playwright.
- Versionamento de API (`/api/v1`).
- Ambiente de homologação.
- Monitoramento e métricas.
- Preparação para multiempresa.

---

## Observações importantes

- Não versionar `.env`.
- Não versionar `node_modules`.
- Não versionar `coverage`.
- Não versionar `dist`.
- Usar `.env.example` para documentar variáveis necessárias.
- Atualizar a documentação sempre que novas rotas ou módulos forem adicionados.

---

## Autor

Desenvolvido por **Matheus Silva Ribeiro**.

Projeto construído com foco em evolução prática de engenharia de software, qualidade de código, automação, segurança e preparação para uso real em ambiente comercial.
