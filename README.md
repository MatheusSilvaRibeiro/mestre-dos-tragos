#  Mestre dos Tragos

Sistema de gestão operacional para lancheria com controle de pedidos em tempo real.

##  Tecnologias

**Backend**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

**Frontend**
- React + TypeScript
- Vite
- React Router DOM

##  Funcionalidades

- Autenticação com perfis (Admin, Atendente, Cozinha)
- Gestão de pedidos em tempo real
- Painel da cozinha com atualização ao vivo
- Dashboard com métricas
- CRUD de cardápio e funcionários
- Histórico de pedidos com filtros

##  Como rodar localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL

### Backend
cd backend
npm install
cp .env.example .env
# Configure o .env com suas credenciais
npx prisma migrate dev
npm run dev

### Frontend
cd mestre-dos-tragos-web
npm install
npm run dev