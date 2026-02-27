# Sentinel

Infrastructure & license tracking system for on-premise deployments. Fully configurable via admin UI — no hardcoded brands or entity types.

## Features

- **Customer Management** — Track customers, contacts, and project managers
- **Server Inventory** — Hostname, IP, OS, environment, components
- **License Tracking** — Encrypted storage, expiry alerts, JWT auto-extraction
- **Credential Vault** — AES-256-GCM encrypted secrets
- **Firewall Rules** — Document network rules per customer
- **Expiry Alerts** — Email & Slack notifications at configurable intervals
- **Audit Logging** — Full change history with before/after diffs
- **Admin Configurable** — Products, environments, OS types, license types all managed via UI

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS + shadcn/ui |
| Database | SQLite via Prisma |
| Auth | NextAuth.js (Google SSO, domain-restricted) |
| Testing | Vitest |

## Development Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Foundation | ✅ Complete | Next.js, Prisma, Auth, Encryption, RBAC, Layout |
| 2. Settings & Lookups | 🔄 Next | Settings service, Lookups API, Admin UI |
| 3. Core Services | ⏳ Pending | Audit service, validation schemas |
| 4. CRUD Entities | ⏳ Pending | Customers, Servers, Licenses, Credentials |
| 5. Notifications | ⏳ Pending | Email/Slack alerts, expiry checks |
| 6. Admin Features | ⏳ Pending | Settings page, Audit log viewer |
| 7. Polish & Testing | ⏳ Pending | Tests, error handling, edge cases |

## Quick Start

### Prerequisites

- Node.js 20+
- Google OAuth credentials ([setup guide](https://developers.google.com/identity/protocols/oauth2))

### Installation

```bash
git clone https://github.com/minakolta/sentinel.git
cd sentinel
npm install
cp .env.example .env
```

### Configuration

Edit `.env`:

```env
DATABASE_URL="file:./data/sentinel.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MASTER_KEY="your-32-byte-encryption-key"
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma db seed  # Seeds initial admin and default lookups
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First-Time Setup

1. Sign in with Google (your email domain must be in the allowed list)
2. First user automatically becomes ADMIN
3. Configure organization settings:
   - Organization name
   - Allowed email domains
   - Alert windows
4. Set up integrations (optional):
   - SMTP for email alerts
   - Slack webhook for notifications
5. Create lookup values:
   - Products
   - Environments
   - Operating Systems
   - Component Types
   - License Types

## Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full access, settings, lookups, integrations, audit logs |
| **USER** | CRUD on customers, servers, licenses, credentials, firewall rules |

## Docker Deployment

```bash
docker build -t sentinel .
docker run -d \
  -p 3000:3000 \
  -v /path/to/data:/data \
  -e DATABASE_URL="file:/data/sentinel.db" \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://sentinel.example.com" \
  -e GOOGLE_CLIENT_ID="..." \
  -e GOOGLE_CLIENT_SECRET="..." \
  -e MASTER_KEY="..." \
  sentinel
```

## Project Structure

```
/app                    # Next.js App Router pages
/components             # React components (ui, forms, tables, layout)
/lib                    # Utilities (db, auth, validations)
/server/services        # Business logic
/server/repositories    # Data access layer
/prisma                 # Schema and migrations
/tests                  # Vitest tests
```

## Documentation

- [Copilot Instructions](.github/copilot-instructions.md) — Development guidelines
- [GitHub Issues](https://github.com/minakolta/sentinel/issues) — Roadmap & task tracking

## License

Private — All rights reserved.
