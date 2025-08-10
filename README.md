# Document Management & Ingestion Service

A production-ready NestJS microservice providing:
- Secure user management & authentication (JWT, role-based access)
- Document storage & metadata management with file handling
- Ingestion orchestration (trigger & lifecycle management of external Python processing)
- Health checks & structured API documentation (Swagger)

---
## 1. Tech Stack
- Node.js / NestJS
- TypeORM + PostgreSQL
- JWT Auth (Access & Refresh tokens via HttpOnly cookies)
- Swagger (OpenAPI) for API docs
- Jest for unit & integration testing
- Class-validator / class-transformer for DTO validation & serialization

---
## 2. Prerequisites
- Node.js >= 18
- npm >= 9
- PostgreSQL >= 13
- (Optional) Docker (for containerized deployment)

---
## 3. Environment Variables
Create `.env.development` (and optionally `.env.production`). Below are the supported variables:

| Variable | Required | Default (Dev) | Description |
|----------|----------|---------------|-------------|
| NODE_ENV | No | development | Runtime environment (development/production) |
| PORT | No | 3000 | HTTP server port |
| FRONTEND_URL | No | http://localhost:4200 | Allowed CORS origin & cookie domain alignment |
| DB_HOST | Yes | - | PostgreSQL host |
| DB_PORT | Yes | - | PostgreSQL port |
| DB_USERNAME | Yes | - | PostgreSQL username |
| DB_PASSWORD | Yes | - | PostgreSQL password |
| DB_DATABASE | Yes | - | PostgreSQL database name |
| JWT_SECRET | Yes | - | Secret key for signing JWT tokens |
| JWT_ACCESS_EXPIRES_IN | Yes | e.g. 30m | Access token time-to-live (e.g. 15m, 30m) |
| JWT_REFRESH_EXPIRES_IN | Yes | e.g. 15d | Refresh token time-to-live (e.g. 7d, 15d) |
| ADMIN_EMAIL | No | admin@doc.com | Auto-provisioned default admin user email (created if none exists) |
| ADMIN_FIRST_NAME | No | Admin | Default admin first name |
| ADMIN_LAST_NAME | No | User | Default admin last name |
| ADMIN_PASSWORD | No | Pass@123 | Default admin password (CHANGE IN PROD) |
| INGESTION_ENDPOINT | No | http://python-backend.local/ingest | External Python ingestion endpoint URL |

Example `.env.development`:
```
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=doc_service
JWT_SECRET=supersecretchangeit
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=15d
ADMIN_EMAIL=admin@doc.com
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
ADMIN_PASSWORD=ChangeMe123!
INGESTION_ENDPOINT=http://localhost:5001/ingest
```

---
## 4. Installation & Setup
```bash
npm install
```
Run database (example via Docker):
```bash
docker run --name doc-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=doc_service -p 5432:5432 -d postgres:15
```
Apply schema:
- In development `synchronize` is enabled automatically.
- For production disable `synchronize` and use migrations (not yet added).

---
## 5. Running the Service
Development (with live reload if you add nodemon):
```bash
npm run start:dev
```
Production build & run:
```bash
npm run build
node dist/main.js
```
Server starts on `http://localhost:3000` (or configured `PORT`).

---
## 6. Authentication Overview
- Login: `POST /auth/login` returns 200 and sets `access_token` & `refresh_token` HttpOnly cookies
- Refresh: `GET /auth/refresh` rotates both tokens
- Current user: `GET /auth/me`
- Protected routes use role-based guards (e.g. ADMIN only for user management)

Role Enum: `ADMIN`, `EDITOR`, `VIEWER`

---
## 7. Document Management
Endpoints (examples):
- `POST /document` (multipart/form-data) – upload document + metadata
- `GET /document` – list documents
- `GET /document/:id` – get document
- `PATCH /document/:id` – update metadata / file
- `DELETE /document/:id` – delete document & files

Files are served statically from `/uploads`.

---
## 8. Ingestion Module
Purpose: Orchestrates ingestion jobs executed by an external Python backend.

Endpoints:
- `POST /ingestion/trigger` – create a new ingestion job (status starts as PENDING then transitions to RUNNING)
- `GET /ingestion` – list jobs (most recent first)
- `GET /ingestion/:id` – get job details
- `PATCH /ingestion/:id` – external callback / management to update status (COMPLETED / FAILED / etc.)

Statuses: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`

External Call Flow:
1. Client triggers job.
2. Service persists job and asynchronously calls `INGESTION_ENDPOINT` via `axios`.
3. External system processes and optionally calls back to `PATCH /ingestion/:id` with status update.

---
## 9. Swagger API Documentation
Accessible at:
```
http://localhost:3000/api
```
Features:
- Organized by Tags (auth, document, ingestion, etc.)
- Cookie-based auth demonstration (set tokens via login first)

Generate OpenAPI JSON (example script you can add):
```bash
curl http://localhost:3000/api-json -o openapi.json
```

---
## 10. Testing & Coverage
Run all tests:
```bash
npm test
```
Run specific module tests:
```bash
npm test -- src/modules/user
npm test -- src/modules/ingestion
```
Watch mode:
```bash
npm run test:watch
```
(If not present you can add a script mapping to `jest --watch`.)

Coverage (add `--coverage`):
```bash
npm test -- --coverage
```
A `coverage/` folder is generated with:
- `lcov-report/index.html` (open in browser for detailed line coverage)
- Function / Branch metrics

---
## 11. Production Hardening Checklist
- Set strong `JWT_SECRET`
- Change default admin credentials (or pre-provision secure admin)
- Disable `synchronize` and use migrations
- Enforce HTTPS & secure cookies (`NODE_ENV=production` sets `secure: true`)
- Add centralized logging (e.g. Winston / Pino)
- Add request rate limiting (e.g. `@nestjs/throttler`)
- Add input size limits for uploads & validation on file types
- Configure robust error monitoring (e.g. Sentry / OpenTelemetry)
- Back up database regularly
- Add retry / DLQ for ingestion external calls if critical

---
## 12. Common Scripts (add to package.json if missing)
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint ."
  }
}
```

---
## 13. Error Handling & Conventions
- Standard NestJS `HttpException` usage (Conflict, NotFound, Unauthorized)
- DTO validation failures return 400 with field messages
- Sensitive fields (password) excluded via `class-transformer`

---
## 14. Future Enhancements
- Add pagination & filtering for documents and ingestion list
- Add cancellation endpoint for ingestion
- Integrate file storage (S3 / GCS) instead of local disk
- Add audit logging for admin actions
- Implement database migrations & seeders
- Add E2E tests for auth + ingestion workflow

---
## 15. Quick Start Summary
```bash
# 1. Copy example env
cp .env.development.example .env.development  # (create based on section 3)
# 2. Install deps
npm install
# 3. Start Postgres (Docker example shown earlier)
# 4. Run service
npm run start:dev
# 5. Open Swagger
http://localhost:3000/api
# 6. Login with default admin
POST /auth/login { email: admin@doc.com, password: ChangeMe123! }
# 7. Trigger ingestion
POST /ingestion/trigger { sourceType: "document", sourceRef: "<id>" }
```

---
## 16. License
See `LICENSE` file.

---
For questions or improvements, open an issue or submit a PR.
