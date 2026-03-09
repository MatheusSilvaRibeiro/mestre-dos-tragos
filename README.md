# Mestre dos Tragos

Sistema web de gestão operacional para lancheria com painel de atendente, cozinha em tempo real via WebSocket e dashboard administrativo. Stack: Node.js + TypeScript + Prisma + PostgreSQL no backend e React + TypeScript no frontend.

## Funcionalidades

- **Atendente** — Cardápio digital com carrinho, adicionais, tamanhos e sabores
- **Cozinha** — Painel Kanban em tempo real via WebSocket com alertas de urgência
- **Dashboard** — Métricas de faturamento, ticket médio e produtos mais vendidos
- **Histórico** — Consulta de pedidos com filtros por período
- **Funcionários** — CRUD com controle de roles
- **Cardápio** — Gestão de produtos, categorias, tamanhos e adicionais

## Stack

**Backend:** Node.js · TypeScript · Express · Prisma · PostgreSQL · Socket.io · JWT

**Frontend:** React · TypeScript · React Router DOM · Axios · Vite

## Perfis de Acesso

| Role | Acesso |
|---|---|
| `ADMIN` | Acesso total |
| `ATENDENTE` | Tela de pedidos |
| `COZINHA` | Painel da cozinha |

## Como Rodar

### Pré-requisitos
- Node.js 18+
- PostgreSQL

### Backend
```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL e JWT_SECRET
npx prisma migrate dev
npm run dev