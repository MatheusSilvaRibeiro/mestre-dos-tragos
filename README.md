<div align="center">
# 🍺 Mestre dos Tragos
 
**Sistema de gestão operacional para bares, lancherias e pequenos restaurantes.**
 
Atendimento • Cozinha em tempo real • Cardápio • Dashboard • Relatórios
 
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-177%20tests-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
 
</div>
---
 
## O que é
 
Um sistema full stack que centraliza o fluxo operacional de um estabelecimento alimentício em três telas conectadas por WebSocket: o **atendente** monta o pedido, a **cozinha** recebe e atualiza o status em tempo real, e o **admin** acompanha tudo — cardápio, funcionários, faturamento e relatórios — em um dashboard central.
 
Três perfis de acesso, JWT, permissões por role, e uma API documentada com Swagger por trás de tudo.
 
## O que este projeto demonstra
 
Além do CRUD básico esperado de um sistema de pedidos, este repositório foi usado deliberadamente como campo de prática de engenharia de software mais ampla:
 
- **Suíte de testes em duas camadas** — 177 testes unitários/integração (Jest, >93% de cobertura) no backend, e uma suíte E2E completa (Playwright) no frontend, rodando contra a API real.
- **Bugs reais encontrados e corrigidos através dos testes**, não apenas escritos depois que tudo já "funcionava" — incluindo um bug de persistência de dados no backend que só apareceu porque um teste E2E foi construído com rigor suficiente para expor a diferença entre "a API respondeu 200" e "a API salvou o dado".
- **Um deploy de produção quebrado, diagnosticado e corrigido** — não um bug de lógica, um problema real de ambiente de build (ver [Limitações conhecidas](#limitações-conhecidas) para o que ainda está em aberto).
- **Fluxo de Git disciplinado**: uma branch por problema, PR por mudança, validação local antes de cada merge.
- **Documentação honesta** sobre o que funciona e o que ainda não está redondo — ver a seção abaixo.
---
 
## Tecnologias
 
**Backend** — Node.js, Express, TypeScript, Prisma + PostgreSQL, Socket.IO, JWT, bcrypt, Zod, Swagger, Helmet, Compression, Rate Limit, Pino, Jest + Supertest.
 
**Frontend** — React, TypeScript, Vite, React Router, Axios, Socket.IO Client, Playwright.
 
**DevOps & qualidade** — Docker Compose, GitHub Actions, CodeQL, Dependabot, Git Flow.
 
---
 
## Estrutura
 
```text
mestre-dos-tragos/
├── backend/                  # API Node.js + Express + Prisma
│   └── src/
│       ├── controllers/ · routes/ · validators/    # camadas da API
│       ├── middlewares/                            # auth, roles, rate limit, log
│       ├── scripts/                                # auditoria/limpeza de dados
│       └── tests/                                  # suíte Jest
├── mestre-dos-tragos-web/    # Frontend React + Vite
│   └── e2e/                                        # suíte Playwright
├── docs/
│   └── API.md                                      # referência completa de endpoints
├── .github/                                        # CI, CodeQL, Dependabot
└── docker-compose.yml
```
 
Referência completa de endpoints e do health check: **[`docs/API.md`](./docs/API.md)**.
 
---
 
## Como rodar
 
Pré-requisitos: Node.js 20+, npm, PostgreSQL (ou Docker), Git.
 
### Backend
 
```bash
cd backend
npm install
cp .env.example .env    # preencher DATABASE_URL, JWT_SECRET, PORT
npx prisma migrate dev
npm run dev              # http://localhost:3333
```
 
### Frontend
 
```bash
cd mestre-dos-tragos-web
npm install
npm run dev               # http://localhost:5173
```
 
> Por padrão o frontend aponta para a API de produção. Para apontar para
> um backend local, defina `VITE_API_URL` (ver `.env.example`).
 
### Docker
 
```bash
docker compose build --no-cache
docker compose up
```
 
Frontend em `localhost:8080`, backend em `localhost:3333`. Requer `backend/.env` preenchido antes de subir.
 
---
 
## Scripts principais
 
| | Backend | Frontend |
|---|---|---|
| Dev | `npm run dev` | `npm run dev` |
| Build | `npm run build` | `npm run build` |
| Lint | `npm run lint` | `npm run lint` |
| Testes | `npm run test` | `npm run test:e2e` |
| Cobertura | `npm run test:coverage` | — |
| Typecheck | `npm run typecheck` | — |
 
`build` e `typecheck` do backend usam configs de TypeScript diferentes de propósito: `build` (`tsconfig.build.json`) exclui os arquivos de teste, porque o compilador de produção nunca deveria precisar deles — misturar os dois já causou uma falha de deploy real.
 
---
 
## Testes
 
**Backend (Jest):** 13 suítes, 177 testes, cobertura global acima de 93%.
 
**Frontend (Playwright):** roda contra a API real de produção — não existe staging ainda — com seed e limpeza automáticos por suíte, para não acumular dados de teste. Requer credenciais de teste via variáveis de ambiente, uma por perfil:
 
```bash
export E2E_ADMIN_USUARIO=... E2E_ADMIN_SENHA=...
export E2E_ATENDENTE_USUARIO=... E2E_ATENDENTE_SENHA=...
export E2E_COZINHA_USUARIO=... E2E_COZINHA_SENHA=...
npm run test:e2e
```
 
Debugar um arquivo isolado com navegador visível: `npm run test:e2e -- e2e/login.spec.ts --headed`.
 
---
 
## Segurança
 
Helmet · CORS por origem · Rate Limit (global + login) · JWT · bcrypt · validação com Zod · controle de acesso por role · logs estruturados com Pino · CodeQL e Dependabot ativos no CI.
 
---
 
## Banco de dados
 
Prisma + PostgreSQL. Entidades principais: `Usuario`, `Categoria`, `Produto` (+ `ProdutoTamanho`, `ProdutoAdicional`), `Adicional` (+ `AdicionalTamanho`), `Pedido` (+ `ItemPedido`, adicionais e sabores). Enums: `Role`, `StatusPedido`, `TipoProduto`, `Tamanho`.
 
`backend/src/scripts/` tem dois utilitários que nasceram de uma necessidade real (limpar dados de teste acumulados em produção antes do cleanup automático existir): `check-e2e-prefixes.ts` (auditoria, só leitura) e `cleanup-e2e-data.ts` (exclusão, dry-run por padrão, só executa de fato com `--confirmar`).
 
---
 
## Fluxo Git
 
`main` (estável) ← `develop` (integração) ← `feature/*` `fix/*` `chore/*` `docs/*`.
 
Branch a partir de `develop`, uma mudança por branch → validações locais → PR para `develop` → CI passa → merge. `develop` só é promovida para `main` em releases estáveis, depois de uma checklist completa (backend + frontend + Docker + validação manual).
 
## CI/CD
 
| Workflow | Gatilho | Faz |
|---|---|---|
| `ci.yml` | — | Lint, typecheck, testes e build do backend |
| `codeql.yml` | push/PR em `main`/`develop`, semanal | Análise estática de segurança |
| `dependabot.yml` | semanal | Atualização de dependências |
 
---
 
## Limitações conhecidas

Um projeto sem limitações documentadas geralmente só significa que ninguém olhou fundo o suficiente. Estas foram encontradas durante rodadas de estabilização — cada uma tem uma causa raiz identificada, não é só "sabemos que existe":

- **Sem ambiente de staging.** A suíte E2E roda contra dados reais de produção. Isso já causou acúmulo de dados de teste no banco (mitigado com scripts de auditoria/limpeza — ver acima), mas o risco estrutural continua enquanto não houver um ambiente separado.
- **Cold start no plano gratuito do Render.** O backend "dorme" após inatividade; o primeiro request do dia pode levar dezenas de segundos, o que afeta diretamente os testes E2E e a primeira impressão de quem acessa.
- **Rate limit da API pode ser restritivo demais para uso real.** O login aceita só 5 tentativas por IP a cada 15 minutos, e a API em geral limita a 100 requisições/15min por IP. Em um estabelecimento com vários funcionários atrás do mesmo roteador, isso pode gerar bloqueios legítimos indesejados. Vale revisar os limites com dados de uso real antes do lançamento.
 
## Roadmap
 
**Concluído:** arquitetura full stack, JWT + 3 perfis, cardápio, WebSocket, dashboard, relatórios, testes unitários e E2E, Swagger, hardening de segurança, logs estruturados, health check com verificação real de banco, Docker, CodeQL, Dependabot, CI (`ci.yml` corrigido, com jobs de backend e frontend), `baseURL` do frontend configurável via `VITE_API_URL`, gestão de itens inativos (ver/reativar).
---
**Próximos passos:** mergear e validar a melhoria de reuso de sessão de login na suíte E2E (reduz consumo de rate limit), revisar os limites de rate limit com dados de uso real, ambiente de staging dedicado, screenshots reais neste README, versionamento de API, monitoramento e métricas.
---
 
<div align="center">
Desenvolvido por **Matheus Silva Ribeiro**
 
</div>