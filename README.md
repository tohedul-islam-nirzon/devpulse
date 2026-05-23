# DevPulse

Internal Tech Issue & Feature Tracker API. A platform for software teams to report bugs, suggest features and coordinate resolutions.

- **Live URL:** _add after deployment_
- **GitHub:** https://github.com/tohedul-islam-nirzon/devpulse

## Features

- User signup and login with JWT auth
- Two roles: `contributor` and `maintainer`
- Create, read, update and delete issues
- Filter issues by type and status, sort by newest or oldest
- Reporter info included with each issue (fetched without JOINs)
- Maintainer-only delete and status changes

## Tech Stack

- Node.js (24.x)
- TypeScript
- Express.js
- PostgreSQL (raw SQL with `pg` driver)
- bcryptjs for password hashing
- jsonwebtoken for JWT

## Folder Structure

```
src/
  app.ts
  server.ts
  config/
  db/
  middleware/
    auth.ts
    globalErrorHandler.ts
  modules/
    auth/
      auth.route.ts
      auth.controller.ts
      auth.service.ts
    issue/
      issue.route.ts
      issue.controller.ts
      issue.service.ts
      issue.interface.ts
  types/
  utility/
    sendResponse.ts
```

## Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/tohedul-islam-nirzon/devpulse
cd devpulse
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT=10
CORS_ORIGIN=*
```

3. Run in development mode:

```bash
npm run dev
```

The tables are created automatically on first run.

## Database Schema

**users**

- `id` SERIAL PK
- `name` VARCHAR(100) NOT NULL
- `email` VARCHAR(150) UNIQUE NOT NULL
- `password` TEXT NOT NULL
- `role` VARCHAR(20) DEFAULT 'contributor'
- `created_at`, `updated_at` TIMESTAMP

**issues**

- `id` SERIAL PK
- `title` VARCHAR(150) NOT NULL
- `description` TEXT NOT NULL
- `type` VARCHAR(20) — `bug` or `feature_request`
- `status` VARCHAR(20) DEFAULT 'open' — `open`, `in_progress`, `resolved`
- `reporter_id` INT NOT NULL
- `created_at`, `updated_at` TIMESTAMP

## API Endpoints

### Auth

| Method | Endpoint           | Access |
| ------ | ------------------ | ------ |
| POST   | /api/auth/signup   | Public |
| POST   | /api/auth/login    | Public |

### Issues

| Method | Endpoint          | Access                                 |
| ------ | ----------------- | -------------------------------------- |
| POST   | /api/issues       | Authenticated                          |
| GET    | /api/issues       | Public                                 |
| GET    | /api/issues/:id   | Public                                 |
| PATCH  | /api/issues/:id   | Maintainer or owner (if status `open`) |
| DELETE | /api/issues/:id   | Maintainer only                        |

Query params on `GET /api/issues`:

- `sort=newest|oldest` (default: newest)
- `type=bug|feature_request`
- `status=open|in_progress|resolved`

The `Authorization` header takes the JWT directly (no `Bearer` prefix).

## Response Format

Success:

```json
{ "success": true, "message": "...", "data": {} }
```

Error:

```json
{ "success": false, "message": "...", "errors": {} }
```
