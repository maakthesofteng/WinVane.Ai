# WinVane.ai Backend (`winvane-ai-be`)

Backend service for **WinVane.ai**, an AI-powered lead discovery and qualification platform for software agencies. Built on NestJS 11, TypeORM, PostgreSQL 16 (with `pgvector`), Redis, and BullMQ.

---

## Company Brain

Each workspace can maintain one Company Brain profile with its delivered technology stacks, industries, services, target regions, company size, pricing, summary, and website. Workspace members with `workspace:read` can view it; members with `workspace:update` can edit and confirm it. Each successful save increments the profile version.

The profile also stores employee/contact records (name, work email, phone, and job title) and any number of company case studies. Case-study details are stored as validated TipTap JSON in a separate table; omitted contact or case-study arrays in an update leave existing records unchanged, while an explicitly empty array removes that section's records.

- `GET /api/v1/company-brain` — get the current workspace profile.
- `PUT /api/v1/company-brain` — save the profile as a draft or confirmed version.
- `POST /api/v1/company-brain/extract` — submit a `multipart/form-data` PDF in the `file` field to extract suggested values. The PDF is processed in memory and is not stored. Extracted values must be reviewed and saved by a workspace member.

PDF extraction uses `pdfplumber` and supports text-based PDFs up to 5 MB and 30 pages. Labeled profile fields, employee contact blocks, and case-study sections (including challenge, solution, and results) can be suggested in the corresponding form sections. Scanned PDFs require OCR and are not supported by this first implementation. For local development, create and activate a Python virtual environment, then install the dependency with `python -m pip install -r requirements-pdf.txt`; set `PDF_PYTHON_EXECUTABLE` if the active environment's Python executable is not `python` (Windows) or `python3` (Linux/macOS). The Docker image installs the dependency in its own virtual environment automatically.

The tenant-specific system integration/script is intentionally deferred; it needs a separate machine-authentication and credential-rotation design. The profile endpoints are workspace-scoped and use the existing tenant session and permission model.

---

## 1. Architecture & Design Principles

- **Framework**: [NestJS 11](https://nestjs.com/) (Modular Monolith architecture, TypeScript strict mode).
- **Authentication Model**:
  - JWT tokens are transported exclusively via **HttpOnly, Secure, SameSite** cookies (never stored in `localStorage` or response bodies).
  - JWT payloads contain `sub` (User ID) and `sid` (Session ID).
  - Requests are validated against a Redis session cache (`session:<sid>`) and PostgreSQL session table, enabling immediate server-side revocation on logout, password reset, or admin action.
- **Security Baseline**:
  - Helmet with strict frameguard (`DENY`), Content-Security-Policy (CSP), and `X-Content-Type-Options: nosniff`.
  - Double-submit cookie CSRF protection (`csrf-csrf`) on all mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Redis-backed rate limiting via `ThrottlerModule` with separate limits for default routes and auth endpoints.
  - Global `ValidationPipe` with strict whitelisting (`forbidNonWhitelisted: true`).
  - Standardized JSON error response envelope masking internal details in production with machine-readable error codes.
  - Per-request UUID tracing with `X-Request-Id` and redaction of sensitive credentials in Pino logs.
- **Database & Queue**:
  - PostgreSQL 16 with `pgvector` and `pgcrypto` extensions.
  - TypeORM with strict migrations (`synchronize: false`).
  - BullMQ with Redis for background jobs (asynchronous email delivery).
- **Email Delivery**:
  - Provider-agnostic adapter (`IMailProvider`).
  - Development defaults to Nodemailer → Mailpit (local SMTP) or Ethereal (preview links).
  - Responsive email templates authored in `.mjml` and compiled via `mjml` library with in-memory caching. Templates are organized module-wise under `src/templates/<module>/`.

### 1.1 Authentication & Authorization Model (Module 1 Phase 2)

#### Cookie Transport & Security
Authentication tokens and ephemeral challenge states are transported strictly via signed/unsigned HttpOnly cookies:

| Cookie | Env Variable | Default Name | Path | HttpOnly | Secure | SameSite |
|---|---|---|---|---|---|---|
| Tenant Session | `SESSION_COOKIE_NAME` | `wv_sess` | `/` | Yes | Yes (in prod) | `Lax` |
| Admin Session | `ADMIN_SESSION_COOKIE_NAME` | `wv_adm_sess` | `/api/v1/admin` | Yes | Yes (in prod) | `Strict` |
| MFA Challenge | `MFA_CHALLENGE_COOKIE_NAME` | `wv_mfa_ch` | `/api/v1/auth` | Yes | Yes (in prod) | `Strict` |

#### Session Lifecycle & Caching
- **Tenant Session TTL**: 7 days (`SESSION_TTL_HOURS=168`).
- **Admin Session TTL**: 8 hours (`ADMIN_SESSION_TTL_HOURS=8`), with an idle timeout of 30 minutes (`ADMIN_SESSION_IDLE_MINUTES=30`).
- **Redis Cache TTL**: 5 minutes (`SESSION_CACHE_TTL_SECONDS=300`) with key `session:<sid>`.
- **User Context Cache**: Cached in Redis with key `authctx:<userId>` for 5 minutes (`AUTH_CONTEXT_CACHE_TTL_SECONDS=300`), containing user status, role, and assigned permissions.
- **Touch Throttling**: Updates to `last_active_at` in Redis and PostgreSQL are throttled to at most once per 60 seconds (`SESSION_TOUCH_INTERVAL_SECONDS=60`) to avoid write amplification.
- **Session Revocation**: Immediate cache invalidation in Redis and soft-revocation in DB (`revoked_at`, `revoked_reason`) upon logout, password change, lockout, or SuperAdmin reset.
- **Background Cleanup Job**: Runs every 15 minutes (`CLEANUP_JOB_INTERVAL_MINUTES=15`) in `SessionService` to permanently purge expired and revoked sessions older than 30 days.

#### Portal Separation & RBAC
- **Strict Boundary**: Tenant routes reject admin sessions (`PORTAL_MISMATCH`), and Admin routes reject tenant sessions (`ADMIN_PORTAL_REQUIRED`).
- **Admin Identification**: Admin routes require the `@AdminPortal()` decorator. `AdminJwtStrategy` enforces `isPlatformRole === true` (only `SuperAdmin` can access platform admin routes).
- **RBAC Enforcement**: `PermissionsGuard` verifies that the authenticated user possesses all permissions specified by `@RequirePermissions(...)`. Platform roles automatically bypass permission checks.

#### Multi-Tenant RBAC Architecture
- **Global vs Workspace Roles**:
  - **Global Roles** (`workspace_id IS NULL`): `SuperAdmin` (platform role, `is_platform_role = true`, platform portal) and `Owner` (workspace creator/owner).
  - **Workspace Roles** (`workspace_id IS NOT NULL`): `Admin`, `Manager`, `Member` are cloned per workspace from `WORKSPACE_ROLE_TEMPLATES` via `WorkspaceRoleProvisioner`. This enables each workspace to customize role permissions independently without impacting others. Workspace system roles cannot be deleted or renamed. Custom roles (`system_key IS NULL`) can be created per workspace.
- **Dynamic Owner Permissions**:
  - The `Owner` role has no static `RolePermission` entries in the database. Instead, `AuthContextService` dynamically grants `Owner` all tenant permissions (`isPlatform = false`), including permissions added by future modules.
  - The Redis user context cache incorporates the permission catalog version (`authctx:v<version>:<userId>`), which is incremented upon catalog updates.
- **Permission Catalog & Metadata**:
  - Every permission key includes catalog metadata: `module`, `moduleLabel`, `label`, `description`, `sortOrder`, `moduleSortOrder`, `isPlatform` (platform vs tenant), and `isAssignable` (whether displayed in role permission editors).
  - `security:self` is non-assignable (`isAssignable = false`) and always granted to all tenant roles.
- **Role Templates**:
  - Code-level templates defined in `roleTemplates.constants.ts` specify default permissions for `Admin`, `Manager`, and `Member`.
  - Automatically provisioned during company registration inside the registration database transaction.
- **Roles & Permissions API & Anti-Escalation Rules (Module 2 Part A Step A7)**:
  - **Endpoints**:
    - `GET /roles` (`roles:read`): Lists workspace roles (Admin, Manager, Member, custom roles). Owner and SuperAdmin are never returned.
    - `GET /roles/:id` (`roles:read`): Retrieves one workspace role with its assignable permission keys.
    - `GET /permissions` (`roles:read`): Dynamic permission catalog grouped by module with caller-specific `grantableKeys`.
    - `POST /roles` (`roles:manage`): Creates a custom workspace role (max 20 custom roles per workspace, reserved names guarded, optional `copyFromRoleId` template).
    - `PATCH /roles/:id` (`roles:manage`): Renames or updates descriptions (system role names are immutable; custom role names are editable).
    - `PUT /roles/:id/permissions` (`roles:manage`): Replaces a role's assignable permission set with cache invalidation via Redis.
    - `DELETE /roles/:id` (`roles:manage`): Deletes an unassigned custom role (`ROLE_IN_USE` error if users still hold it).
  - **Anti-Escalation Safeguards (Server-Side)**:
    1. *Cannot Edit Own Role*: A non-Owner caller cannot modify the permissions or name of the role they currently hold (`403 CANNOT_EDIT_OWN_ROLE`).
    2. *Subset Management Rule*: A non-Owner can only edit roles whose current permission set is a strict subset of the caller's permissions (`403 ROLE_NOT_MANAGEABLE`).
    3. *Grant/Revoke Scope Rule*: A non-Owner caller can only grant or revoke permissions that they themselves currently hold (`403 PERMISSION_NOT_GRANTABLE`).
    4. *Invalid & Platform Keys Blocked*: Platform keys (`admin:*`) and non-assignable keys (`security:self`) are rejected with `400 PERMISSION_INVALID`. `security:self` is automatically retained on every tenant role.
    5. *Owner Bypass & No Lock-Out Risk*: The workspace Owner bypasses rules 1–3. Since the Owner implicitly holds all non-platform tenant permissions dynamically without static database bindings, a workspace can never suffer from an administrative lockout—an Owner can always restore or reassign any role at any time.
  - **Extensibility for Future Modules (Data-Driven Catalog)**:
    - The permission catalog is 100% data-driven from the `permissions` table metadata (`module`, `moduleLabel`, `label`, `description`, `sortOrder`, `moduleSortOrder`, `isAssignable`, `isPlatform`).
    - Future modules register their permission groups and default templates purely via database seed files (`seed:roles`). The backend API contains zero hardcoded module lists.
  - **Real-Time Cache Invalidation**:
    - Replacing a role's permissions calls `AuthContextService.invalidateByRole(roleId)`, purging cached auth contexts in Redis for all users with that role. Users receive their updated permissions on their next HTTP request without requiring re-login or session revocation.
- **Seed Behavior (`seed:roles`)**:
  - Idempotently reconciles global roles (`SuperAdmin`, `Owner`), the permission catalog with full metadata, and SuperAdmin platform permissions.
  - Ensures workspace system roles exist for all registered workspaces via `WorkspaceRoleProvisioner`.
  - When new permission keys are introduced, grants them to workspace system roles whose template includes them without overwriting custom permission adjustments.
  - Bumps the Redis catalog version (`rbac:permission_catalog_version`).

### 1.2 Tenant Portal Authentication (Module 1 Phase 3)

Tenant authentication provides self-service company onboarding, domain-based multi-tenancy, email verification, login with lockout protection, MFA challenge completion, password reset, and session management.

#### Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Throttled | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Yes (auth) | Onboards company workspace and owner account. Blocks free/disposable email domains (`400 FREE_EMAIL_DOMAIN`). Uses anti-enumeration timing and sends duplicate workspace notifications with a 1-hour cooldown. Generates a 24-hour verification token. |
| `POST` | `/api/v1/auth/verify-email` | Public | Yes (auth) | Validates single-use verification token and activates the owner account and company workspace atomically. |
| `POST` | `/api/v1/auth/resend-verification` | Public | Yes (auth) | Resends verification email. Enforces a 60-second cooldown and max 5 requests/day per email via Redis. Returns generic 202 message. |
| `POST` | `/api/v1/auth/login` | Public | Yes (auth) | Authenticates tenant users. Rejects platform admin credentials (`SuperAdmin`) with generic 401. Enforces account lockout (5 failed attempts = 15-minute lock). Verifies email and workspace active status (returns 403 `EMAIL_NOT_VERIFIED` if unverified). Sets HttpOnly session cookie or returns MFA challenge (`wv_mfa_ch`). |
| `POST` | `/api/v1/auth/mfa/verify` | Public | Yes (auth) | Verifies TOTP code or single-use backup code using the `wv_mfa_ch` cookie. On success, issues active session cookie. |
| `POST` | `/api/v1/auth/logout` | Authenticated | No | Revokes current session in Redis and database, and clears the session cookie (`204 No Content`). |
| `GET` | `/api/v1/auth/me` | Authenticated | No | Returns the authenticated user's profile, role, permissions list, and company workspace summary. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Yes (auth) | Initiates password reset with 1-hour token. Enforces 60-second cooldown and 5 requests/day limit. Returns byte-identical 202 response for anti-enumeration. |
| `POST` | `/api/v1/auth/reset-password` | Public | Yes (auth) | Validates reset token, checks password policy, verifies against password reuse, updates hash, clears lockouts, and revokes all active sessions (`PASSWORD_RESET`). |

#### Scheduled Maintenance (`AuthCleanupJob`)
- **Hourly**: Purges expired and used verification and password reset tokens older than 7 days.
- **Daily**: Cleans up abandoned `pending_verification` workspaces and unverified owners older than 48 hours.

#### Global Guards & Decorators
All endpoints are protected by default (default-deny architecture):

- **`SessionAuthGuard` (Global)**:
  - Bypassed when `@Public()` is present.
  - Dynamically selects `jwt-admin` passport strategy when `@AdminPortal()` is detected; otherwise defaults to `jwt-tenant`.
  - Attaches validated `IAuthContext` to `req.authContext` and `req.user`.
- **`PermissionsGuard` (Global)**:
  - Bypassed when `@Public()` is present.
  - Enforces granular permission keys declared via `@RequirePermissions('permission:key')`.
- **Decorators**:
  - `@Public()`: Exempts route/controller from authentication.
  - `@AdminPortal()`: Designates route/controller as an admin endpoint.
  - `@RequirePermissions(...permissions)`: Enforces required permission keys.
  - `@CurrentAuth()`: Injects the active `IAuthContext` into controller route handlers.

#### Machine-Readable Error Codes
Errors emitted by guards and auth services return standardized JSON envelopes with one of 12 machine-readable codes:

| Error Code | HTTP Status | Description |
|---|---|---|
| `SESSION_EXPIRED` | 401 | Session exceeded its maximum TTL or admin idle timeout |
| `SESSION_REVOKED` | 401 | Session has been explicitly revoked or invalidated |
| `INVALID_TOKEN` | 401 | JWT signature verification failed or token is malformed |
| `UNAUTHORIZED` | 401 | Missing authentication credentials |
| `PORTAL_MISMATCH` | 403 | Attempted to access tenant routes with an admin session |
| `ADMIN_PORTAL_REQUIRED` | 403 | Attempted to access admin routes with a non-admin session |
| `MFA_REQUIRED` | 403 | Step-up MFA verification is required to complete action |
| `MFA_CHALLENGE_EXPIRED` | 401 | MFA challenge session expired (exceeded 300s TTL) |
| `INVALID_MFA_TOKEN` | 400 | Provided TOTP code or backup code is invalid or already used |
| `ACCOUNT_LOCKED` | 423 | Account locked due to excessive failed login attempts |
| `FORBIDDEN` | 403 | General access restriction |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required RBAC permissions |

---

## 2. Prerequisites

- **Node.js**: `22.x LTS`
- **npm**: `10.x` or higher
- **Docker & Docker Compose**: v2.20+

---

## 3. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

### Key Configuration Variables

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | API server listening port | `5173` |
| `API_PREFIX` | Global API route prefix | `api/v1` |
| `FRONTEND_URL` / `CORS_ORIGINS` | Allowed frontend origin for CORS credentials | `http://localhost:3000` |
| `DB_HOST` / `DB_PORT` | PostgreSQL host and port | `localhost` / `5433` (see note below) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL credentials | `winvane` / `change_me` / `winvane` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis connection details | `localhost` / `6379` / `change_me` |
| `JWT_SECRET` | Secret for signing JWTs (min 32 characters) | Min 32 chars |
| `CSRF_SECRET` | Secret for CSRF double-submit protection | Min 32 chars |
| `DATA_ENCRYPTION_KEY` | Base64-encoded 32-byte key for encryption at rest | 32-byte base64 |
| `SUPERADMIN_EMAIL` | Platform SuperAdmin seed email address | `admin@winvane.ai` |
| `SUPERADMIN_PASSWORD` | Platform SuperAdmin seed password | (min 8 chars, upper/lower/digit/symbol) |
| `SUPERADMIN_FULL_NAME` | Platform SuperAdmin display name | `Super Admin` |
| `MAIL_PROVIDER` | Mail transport: `smtp` (Mailpit) or `ethereal` | `smtp` |
| `SMTP_HOST` / `SMTP_PORT` | SMTP relay coordinates | `localhost` / `1025` |

> [!NOTE]
> **Windows Port Note**: If your host Windows machine has a local PostgreSQL service running on port `5432`, set `DB_PORT=5433` in your `.env`. `docker-compose.yml` dynamically maps `"${DB_PORT:-5432}:5432"`.

---

## 4. Local Infrastructure (Docker)

Start the backing services (PostgreSQL + pgvector, Redis, and Mailpit):

```bash
# Start infrastructure containers in the background
npm run docker:up

# Check service logs
npm run docker:logs

# Stop containers
npm run docker:down
```

---

## 5. Database Schema & Migrations

TypeORM is configured with `synchronize: false`. All database schema changes are applied via versioned migrations.

### Schema & ERD Summary (Module 1 Data Foundation)

| Entity / Table | Description | Key Relationships & Constraints |
|---|---|---|
| `workspaces` | Company / tenant accounts | Unique lowercase `domain`. FK `owner_user_id` &rarr; `users.id` (set null). |
| `users` | Platform and tenant users | Unique lowercase `email`. FK `role_id` &rarr; `roles.id` (restrict). FK `workspace_id` &rarr; `workspaces.id` (cascade, null for SuperAdmin). `password_hash` (`select: false`). |
| `roles` | System roles (`SuperAdmin`, `Owner`, `Admin`, `Member`) | Unique `name`. Flag `is_platform_role` (true only for SuperAdmin). |
| `permissions` | Granular permission keys | Unique `key` (e.g. `workspace:update`, `security:self`). |
| `role_permissions` | Composite join table | Composite PK (`role_id`, `permission_id`) with cascade deletes. |
| `sessions` | Server-side tracked JWT sessions | FK `user_id` (cascade). Indexed (`user_id`, `revoked_at`) & `expires_at`. |
| `domain_verification_tokens` | Email verification & domain proof | FK `workspace_id`, FK `user_id`. Unique `token_hash`. |
| `password_reset_tokens` | Ephemeral reset tokens | FK `user_id`. Unique `token_hash`. |
| `mfa_devices` | TOTP device secrets & backup codes | 1:1 with `users`. `secret_encrypted` & `backup_codes` (`select: false`). |
| `audit_logs` | Append-only security & system audit log | Actor `actor_user_id` (set null). Denormalized `workspace_id`. Sanitized metadata. |

### Migration Commands

```bash
# Apply all pending migrations (EnableExtensions + AuthSchema)
npm run migration:run

# Revert the latest migration
npm run migration:revert

# Check migration status
npm run migration:show
```

---

## 6. Seed Scripts & SuperAdmin Management

Seed scripts run via `ts-node` and are cross-platform compatible (Windows, macOS, Linux, and Docker).

### 6.1 Master Seed Command (`seed`)

Runs all database seeds in sequence (`seed:roles` followed by `seed:superadmin`):

```bash
npm run seed
# In Docker:
# docker compose exec api npm run seed
```

### 6.2 Seed Roles & Permissions (`seed:roles`)

Upserts global roles (`SuperAdmin`, `Owner`), all catalog permission keys with metadata, SuperAdmin grants, workspace system roles (`Admin`, `Manager`, `Member`) for all workspaces, and bumps the Redis catalog version:

```bash
npm run seed:roles
# In Docker:
# docker compose exec api npm run seed:roles
```

### 6.3 Seed SuperAdmin (`seed:superadmin`)

Initializes or resets the platform SuperAdmin account using `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, and `SUPERADMIN_FULL_NAME` from `.env`:

```bash
# Initial creation (fails if SuperAdmin already exists)
npm run seed:superadmin

# Password reset (updates hash, clears lockout, revokes all active sessions)
npm run seed:superadmin -- --reset

# MFA reset / lost device recovery (deletes TOTP device, revokes sessions, forces re-enrollment)
npm run seed:superadmin -- --reset-mfa

# Combined reset
npm run seed:superadmin -- --reset --reset-mfa

# In production (NODE_ENV=production), --confirm is mandatory:
npm run seed:superadmin -- --reset --confirm
```

---

## 7. Development & Testing Commands

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov

# Run static type checking
npm run typecheck

# Run ESLint (enforces AGENTS.md conventions & max line limits)
npm run lint

# Production build
npm run build
```

---

## 8. Project Structure

```
src/
├── app.module.ts              # Root application module wiring
├── main.ts                    # Bootstrap sequence, security middleware, pipes, filters
├── common/
│   ├── constants/             # Injection tokens, password policy, headers, cookies
│   ├── decorators/            # @Public(), @SkipCsrf() decorators
│   ├── filters/               # HttpExceptionFilter (standardized error envelopes)
│   ├── interceptors/          # RequestIdInterceptor (X-Request-Id header propagation)
│   ├── interfaces/            # TypeScript interfaces (IErrorResponse, IMailMessage)
│   └── middleware/            # RequestIdMiddleware
├── config/
│   ├── env.schema.ts          # Zod environment schema & fail-fast validation
│   └── configuration.ts       # Typed configuration factory
├── database/
│   ├── dataSource.ts          # TypeORM CLI DataSource configuration
│   ├── typeormConfig.ts       # Shared runtime & CLI database options
│   ├── snakeNamingStrategy.ts # Custom SnakeNamingStrategy
│   ├── migrations/            # SQL migrations (Extensions, AuthSchema)
│   └── seeds/                 # Seed scripts (seedRoles, seedSuperadmin)
├── templates/                 # Module-organized MJML email templates
│   └── auth/                  # verification.mjml, workspace-exists.mjml, password-reset.mjml, etc.
└── modules/
    ├── audit/                 # AuditLogModule, AuditLogService, entities, constants
    ├── auth/                  # Session, tokens, MfaDevice entities
    ├── auth-core/             # AuthCoreModule: sessions, cookies, crypto, MFA, guards, strategies
    ├── health/                # Health check endpoint (DB & Redis status)
    ├── mail/                  # Nodemailer providers, BullMQ queue, and MailProcessor
    ├── queue/                 # BullMQ root module configuration
    ├── rbac/                  # RbacModule, Role, Permission, RolePermission entities
    ├── redis/                 # Global ioredis client provider & RedisService
    ├── security/              # CSRF service, guard, and csrf-token controller
    ├── users/                 # UsersModule, UsersService, User entity
    └── workspace/             # WorkspaceModule, Workspace entity
```

---

## 9. Code Standards & Git Workflow

- **Branching Policy**: Follows GitFlow per `AGENTS.md`. Features are branched from `dev` as `feature/<short-kebab-name>`.
- **Commit Convention**: Follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `ci:`).
- **Line Limits**: Hard ceiling of 300 lines per file (max 100 lines for type definitions).
- **Security Standards**: No secrets committed, no `console.log` in production, zero unvalidated inputs.
