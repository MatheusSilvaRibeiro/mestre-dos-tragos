# Referência da API

Documentação interativa completa (Swagger), com backend rodando:

```text
http://localhost:3333/api-docs
```

Config em `backend/src/docs/swagger.ts`.

## Autenticação

Todas as rotas abaixo, exceto `/health`, `/` e `/api/auth/login`, exigem um token JWT válido:

```
Authorization: Bearer <token>
```

Rotas marcadas com 🔒 exigem também o perfil `ADMIN`.

## Endpoints

| Recurso | Rota base | Métodos |
|---|---|---|
| Autenticação | `/api/auth` | `POST /login` · `POST /cadastrar` 🔒 · `GET /funcionarios` 🔒 |
| Categorias | `/api/categorias` | `GET /` · `POST /` 🔒 · `PUT /:id` 🔒 · `DELETE /:id` 🔒 |
| Produtos | `/api/produtos` | `GET /` · `GET /:id` · `POST /` 🔒 · `PUT /:id` 🔒 · `PATCH /:id/disponibilidade` 🔒 · `DELETE /:id` 🔒 |
| Adicionais | `/api/adicionais` | `GET /` · `GET /:id` · `POST /` 🔒 · `PUT /:id` 🔒 · `DELETE /:id` 🔒 |
| Pedidos | `/api/pedidos` | `GET /` · `GET /:id` · `POST /` (ADMIN/ATENDENTE) · `PATCH /:id/status` · `PATCH /:id/cancelar` (ADMIN/ATENDENTE) |
| Usuários | `/api/usuarios` | `GET /` 🔒 · `POST /` 🔒 · `PUT /:id` 🔒 · `DELETE /:id` 🔒 |
| Dashboard | `/api/dashboard` | `GET /hoje` 🔒 · `GET /resumo` 🔒 · `GET /top-produtos` 🔒 · `GET /faturamento` 🔒 |
| Relatórios | `/api/relatorios` | `GET /dia` 🔒 · `GET /periodo` 🔒 · `GET /produtos` 🔒 · `GET /atendentes` 🔒 · `GET /pedidos-status` 🔒 · `GET /cancelamentos` 🔒 · `GET /comparativo-semanal` 🔒 |

> `PUT /categorias/:id`, `PUT /produtos/:id` e `PUT /adicionais/:id` editam os dados do recurso (nome, preço etc.) e também o campo `ativo` (visível/oculto no catálogo). A desativação também está disponível via `DELETE /:id`.

## Health check

```text
GET /health
```

Verifica conectividade real com o banco (consulta via Prisma), não só se o processo está no ar:

```json
{
  "status": "ok",
  "service": "mestre-dos-tragos-api",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 123.45,
  "database": "connected",
  "memory": { "rss": "80 MB", "heapUsed": "40 MB", "heapTotal": "60 MB" },
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

`status` vira `"degraded"` (HTTP 200) se a consulta ao banco falhar — útil para monitoramento externo diferenciar "processo no ar" de "aplicação saudável".

Em desenvolvimento (`NODE_ENV !== 'production'`), existe também `POST /setup` para criar o primeiro ADMIN quando o banco está vazio. Não disponível em produção.