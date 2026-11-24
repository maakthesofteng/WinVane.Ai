# WinVane.ai Frontend (`winvane-ai-fe`)

Frontend client application for **WinVane.ai**, an AI-powered B2B lead discovery and qualification platform for software agencies. Built on Next.js 16 (App Router), React 19, Redux Toolkit, TanStack Query v5, Tailwind CSS v4, and shadcn/ui.

---

## 1. Architecture & Design Principles

- **Framework**: Next.js 16 (App Router, Turbopack, React 19 strict mode).
- **Authentication Model**:
  - JWT credentials are saved exclusively in **HttpOnly, Secure, SameSite** cookies (`wv_session`) managed by the backend.
  - The frontend never reads, stores, or handles tokens directly (no tokens in `localStorage`, `sessionStorage`, or Redux).
  - All outgoing requests use `withCredentials: true`.
  - The frontend performs optimistic UX route redirects via `proxy.ts` (Next.js 16 convention), while all real authorization is enforced server-side by the backend.
- **State Management Separation**:
  - **Redux Toolkit (`src/store`)**: Primary client state (auth/session status, current user profile & role, workspace context, global modal/sidebar toggles).
  - **TanStack Query (`src/lib/query`)**: Server data cache (lists, lead records, dashboard stats). Server responses are never duplicated into Redux.
- **CSRF & API Layer (`src/lib/api`)**:
  - Axios client configured with lazy double-submit CSRF token fetching (`GET /security/csrf-token`) and `x-csrf-token` header attachment for state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Automatic single-retry on CSRF invalidation (403).
  - Global `401 Unauthorized` event emission routing to `/login?next=...`.
  - Normalized error handling into `ApiError` envelopes with support reference identifiers (`Ref: <requestId>`).
- **Brand & Design System**:
  - Dark-first aesthetic (`<html className="dark">`).
  - Brand palette: Dark Navy (`#0B1220`) page background, Card surface (`#111A2E`), Dividers/Borders (`#24314F`), and a single Mint Accent (`#3DDC97`) for CTAs, badges, and focus rings. **No purple hues.**
  - Primitives built with shadcn/ui and Tailwind CSS v4 CSS-first theming.

---

## 2. Prerequisites

- **Node.js**: `22.x LTS`
- **npm**: `10.x` or higher
- **Backend Service**: `winvane-ai-be` running on `http://localhost:5173/api/v1`

---

## 3. Environment Configuration

Copy the example configuration:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Scope | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public (Client + Server) | URL to NestJS backend API | `http://localhost:5173/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Public (Client + Server) | Application title | `WinVane.ai` |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Frontend client origin | `http://localhost:3000` |
| `SESSION_COOKIE_NAME` | Server-only (`proxy.ts`) | Auth session cookie key | `wv_session` |

> [!NOTE]
> In local development, cookies set by `:4000` on `localhost` are accessible to `:3000` because cookies are domain-scoped rather than port-scoped. In production, the client and API must share a root domain (e.g., `app.winvane.ai` and `api.winvane.ai` with cookie domain `.winvane.ai`).

---

## 4. Development & Tooling Commands

```bash
# Start development server with Turbopack
npm run dev

# Run static TypeScript type check (noEmit)
npm run typecheck

# Run ESLint (enforces naming conventions and max-lines rules)
npm run lint

# Automatically fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Production build
npm run build

# Start production server
npm start
```

---

## 5. Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with fonts, Providers, Toaster
│   ├── page.tsx                      # Root route redirecting to /login
│   ├── providers.tsx                 # Client providers (StoreProvider + QueryClientProvider)
│   ├── globals.css                   # Tailwind v4 theme tokens & CSS variables
│   ├── error.tsx / global-error.tsx  # Error boundaries
│   ├── not-found.tsx                 # 404 page
│   ├── loading.tsx                   # Loading state with FullPageSpinner
│   ├── (auth)/                       # Centered card layout for authentication flows
│   │   ├── login/, signup/, verify-email/, forgot-password/, reset-password/, accept-invite/, mfa/
│   ├── (workspace)/                  # Authenticated workspace layout
│   │   ├── dashboard/, settings/, team/
│   ├── (admin)/                      # SuperAdmin management layout
│   │   └── admin/                    # dashboard/, tenants/, audit-log/
│   └── (dev)/
│       └── ui-kit/                   # Dev-only design system preview (404 in production)
├── components/
│   ├── common/                       # Shared components: Logo, PageHeader, FullPageSpinner, EmptyState
│   └── ui/                           # Vendored shadcn primitives (button, input, card, dialog, etc.)
├── config/
│   └── env.ts                        # Zod-validated environment configuration
├── constants/
│   ├── app.ts                        # Global constants (APP_NAME, CSRF_HEADER_NAME)
│   └── routes.ts                     # ROUTES constants & resolveRouteAccess helper
├── lib/
│   ├── api/                          # apiClient, csrf token manager, apiError, authEvents
│   ├── query/                        # makeQueryClient and QUERY_KEYS factory
│   └── utils/
│       └── cn.ts                     # clsx + tailwind-merge utility
├── shared/
│   └── schemas/                      # Zod schemas (common.schema.ts)
├── store/
│   ├── index.ts                      # makeStore(), TRootState, TAppDispatch, TAppStore
│   ├── hooks.ts                      # useAppDispatch, useAppSelector, useAppStore
│   ├── StoreProvider.tsx             # Client store wrapper
│   └── slices/                       # authSlice.ts, uiSlice.ts
└── proxy.ts                          # Next.js 16 route protection proxy
```

---

## 6. Code Quality & Standards

- **Line Limits**:
  - React components (`*.tsx`): &le; 200 lines
  - Utilities and state: &le; 250 lines
  - Types: &le; 100 lines
- **Naming Conventions**:
  - Components: `PascalCase`
  - Interfaces: `IPascalCase`
  - Types: `TPascalCase`
  - Variables & Functions: `camelCase`
  - Constants: `SCREAMING_SNAKE_CASE`
- **Vendored Exception**: `src/components/ui/` primitives generated by the shadcn CLI are exempt from naming lint checks to maintain compatibility with `npx shadcn add`.
- **Security Checklist**:
  - No secrets in `NEXT_PUBLIC_*`.
  - No `dangerouslySetInnerHTML`.
  - No auth credentials in web storage.
  - Strict CSP, frameguard (`DENY`), and removal of `X-Powered-By`.
