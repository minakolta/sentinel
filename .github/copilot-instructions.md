# Sentinel — Copilot Instructions

Multi-tenant infrastructure & license tracking system. Fully configurable via admin UI, no hardcoded business logic. Focus on security, auditability, and user-friendly design and UX.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict, no `any`) |
| Styling | TailwindCSS + shadcn/ui (sky theme) |
| Database | SQLite via Prisma (`/data/sentinel.db`) |
| Auth | NextAuth.js (Google Provider, domain-restricted) |
| Testing | Vitest (≥80% coverage) |
| Project Mgmt | GitHub Issues + MCP |

---

## GitHub Project Management (MCP)

Use the **github-official** MCP server to manage issues and track progress.

### Issue Operations
```typescript
// List issues by phase
mcp_mcp_docker_list_issues({ owner, repo, labels: ["Phase 2"], state: "OPEN" })

// Close completed issues
mcp_mcp_docker_issue_write({ owner, repo, issue_number, method: "update", state: "closed", state_reason: "completed" })

// Add completion comment
mcp_mcp_docker_add_issue_comment({ owner, repo, issue_number, body: "Completed in commit xyz" })

// Search issues
mcp_mcp_docker_search_issues({ owner, repo, query: "label:phase:2-settings state:open" })
```

### Phase Labels
| Label | Description |
|-------|-------------|
| `phase:1-foundation` | Next.js, Prisma, Auth, Encryption |
| `phase:2-settings` | Settings service, Lookups API |
| `phase:3-services` | Audit service, validation schemas |
| `phase:4-crud` | Entity CRUD operations |
| `phase:5-notifications` | Email/Slack alerts |
| `phase:6-admin` | Admin UI features |
| `phase:7-polish` | Tests, security, CI/CD |

### Workflow
1. Before starting work: Check open issues for current phase
2. After completing task: Close issue with `state_reason: "completed"`
3. Add comment referencing commit hash
4. Push code and update README status

---

## Project Structure

```
/app                    # Next.js App Router pages
  /(auth)/login         # Auth pages
  /(dashboard)/         # Protected layout
    /customers
    /servers
    /licenses
    /credentials
    /firewall-rules
    /audit-logs         # ADMIN only
    /settings           # ADMIN only (org config, lookups)
  /api                  # Route handlers
    /auth/[...nextauth]
    /customers
    /servers
    /licenses
    /credentials
    /firewall-rules
    /audit-logs
    /notifications
    /settings
    /lookups            # CRUD for dynamic lookup tables
/components
  /ui                   # shadcn components
  /forms                # Entity forms with Zod validation
  /tables               # Data tables with sorting/filtering
  /layout               # Shell, Sidebar, Header
/lib
  /db.ts                # Prisma client singleton
  /auth.ts              # NextAuth config + RBAC + domain check
  /validations          # Zod schemas per entity
/server
  /services             # Business logic (NO logic in components)
    /encryption.ts      # AES-256-GCM for secrets
    /license.ts         # Expiry extraction, JWT decode
    /notification.ts    # Email (Google SMTP) + Slack webhook
    /audit.ts           # Change tracking with before/after diff
    /settings.ts        # Org config + lookup management
  /repositories         # Data access layer
/prisma
  /schema.prisma
  /migrations
/tests                  # Vitest tests mirroring /server/services
```

---

## Data Model (Prisma)

### Enums (only fixed system enums)
```prisma
enum Role { ADMIN USER }
enum Protocol { TCP UDP }
```

### Lookup Tables (admin-configurable)
```prisma
model Product {
  id        String   @id @default(cuid())
  name      String   @unique    // e.g., "Platform A", "Platform B"
  createdAt DateTime @default(now())
}

model Environment {
  id        String   @id @default(cuid())
  name      String   @unique    // e.g., "SIT", "UAT", "PROD", "DR"
  order     Int      @default(0) // for sorting
  createdAt DateTime @default(now())
}

model OperatingSystem {
  id        String   @id @default(cuid())
  name      String   @unique    // e.g., "Windows", "Linux", "macOS"
  createdAt DateTime @default(now())
}

model ComponentType {
  id        String   @id @default(cuid())
  name      String   @unique    // e.g., "Web Server", "Database", "API Gateway"
  createdAt DateTime @default(now())
}

model LicenseType {
  id        String   @id @default(cuid())
  name      String   @unique    // e.g., "JWT Token", "License File", "API Key"
  isJwt     Boolean  @default(false) // if true, auto-extract exp from JWT
  createdAt DateTime @default(now())
}
```

### Organization Settings
```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json                          // encrypted for sensitive keys
  updatedBy String?
  updatedAt DateTime @updatedAt
}
// Setting keys:
// - "org.name"           → string (displayed in header/footer)
// - "org.allowedDomains" → string[] (e.g., ["acme.com", "acme.io"])
// - "alerts.windows"     → number[] (default: [60, 30, 14, 7, 3, 1])
//
// Integration settings (encrypted, admin-only):
// - "smtp.config"        → { host, port, user, encryptedPass }
// - "smtp.enabled"       → boolean
// - "slack.webhookUrl"   → string (encrypted)
// - "slack.enabled"      → boolean
```

### Core Entities

| Entity | Key Fields |
|--------|------------|
| **User** | id, email, name, role (ADMIN/USER), image |
| **Customer** | id, name, code, contacts (JSON), projectManagers (JSON) |
| **Server** | id, customerId, hostname, ip, osId→OS, role, environmentId→Environment |
| **Component** | id, serverId, typeId→ComponentType |
| **License** | id, customerId, productId→Product, typeId→LicenseType, encryptedValue, expiresAt, environmentId→Environment, notes |
| **Credential** | id, customerId, serverId?, username, encryptedSecret, url?, notes? |
| **FirewallRule** | id, customerId, srcRole, srcIp, dstRole, dstIp, port, protocol, comment? |
| **AuditLog** | id, userId, entity, entityId, action (CREATE/UPDATE/DELETE), before (JSON), after (JSON), timestamp |
| **NotificationLog** | id, licenseId, channel (EMAIL/SLACK), sentAt, daysBeforeExpiry |

### Relations
- Customer → hasMany: Servers, Licenses, Credentials, FirewallRules
- Server → hasMany: Components, Credentials; belongsTo: Customer, OperatingSystem, Environment
- License → belongsTo: Customer, Product, LicenseType, Environment
- Component → belongsTo: Server, ComponentType

---

## Security Requirements

### Domain-Restricted Auth (`/lib/auth.ts`)
```typescript
// On sign-in, check email domain against Setting("org.allowedDomains")
async function isAllowedDomain(email: string): Promise<boolean> {
  const domains = await getSetting<string[]>('org.allowedDomains');
  const emailDomain = email.split('@')[1];
  return domains.includes(emailDomain);
}
// Reject sign-in if domain not in allowlist
```

### Encryption Service (`/server/services/encryption.ts`)
```typescript
// Use AES-256-GCM with MASTER_KEY from env
encrypt(plaintext: string): string    // Returns: iv:authTag:ciphertext (base64)
decrypt(encrypted: string): string
// NEVER log plaintext secrets
```

### RBAC (`/lib/auth.ts`)
```typescript
// Enforce server-side on ALL routes
requireRole(session: Session, roles: Role[]): void  // Throws if unauthorized
requireAuth(session: Session): void
```

| Role | Permissions |
|------|-------------|
| ADMIN | Full access, Settings, Lookups, Integrations, Audit Logs |
| USER | CRUD on Customers, Servers, Components, Licenses, Credentials, FirewallRules |

---

## License Expiry Alerts

### Alert Windows (configurable via Settings)
Default: `[60, 30, 14, 7, 3, 1]` — stored in `Setting("alerts.windows")`

### Notification Service (`/server/services/notification.ts`)
```typescript
interface AlertPayload {
  customer: string;
  product: string;       // from Product lookup
  environment: string;   // from Environment lookup
  licenseType: string;   // from LicenseType lookup
  expiresAt: Date;
  daysRemaining: number;
}

// Reads config from Settings table
sendEmail(payload: AlertPayload, recipients: string[]): Promise<void>
sendSlack(payload: AlertPayload): Promise<void>
```

### Rules
- Check daily via cron/scheduled job
- Log each notification to `NotificationLog`
- **Deduplicate**: Skip if (licenseId + daysBeforeExpiry) already sent

---

## Audit Service (`/server/services/audit.ts`)

```typescript
// Call on every mutation
logChange(params: {
  userId: string;
  entity: string;        // 'Customer' | 'License' | etc.
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  before?: Record<string, unknown>;  // null for CREATE
  after?: Record<string, unknown>;   // null for DELETE
}): Promise<void>
```

### Admin Audit UI
- Filter by: user, entity type, date range
- Display JSON diff (before/after) with highlighting

---

## API Patterns

### Route Handler Template
```typescript
// /app/api/[entity]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, requireAuth, requireRole } from '@/lib/auth';
import { entitySchema } from '@/lib/validations/entity';
import { EntityService } from '@/server/services/entity';

export async function GET() {
  const session = await getServerSession(authOptions);
  requireAuth(session);
  const data = await EntityService.findAll();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  requireAuth(session);
  const body = await req.json();
  const validated = entitySchema.parse(body);  // Zod validation
  const created = await EntityService.create(validated, session.user.id);
  return NextResponse.json(created, { status: 201 });
}
```

---

## UI Standards

### Components (shadcn/ui only)
- Forms: `Form`, `FormField`, `Input`, `Select`, `Button`
- Tables: `DataTable` with sorting, filtering, pagination
- Feedback: `Toast`, `AlertDialog` for confirmations
- Layout: `Card`, `Tabs`, `Sheet` for sidepanels

### Form Validation
- Zod schemas in `/lib/validations/`
- Client + server validation
- Display inline errors

---

## Testing Requirements

### Must Test (`/tests/`)
1. `encryption.test.ts` — encrypt/decrypt roundtrip, invalid key handling
2. `license.test.ts` — JWT exp extraction, expiry calculation
3. `notification.test.ts` — deduplication logic, payload formatting
4. `audit.test.ts` — diff generation, log creation
5. `rbac.test.ts` — role enforcement, unauthorized rejection
6. `auth.test.ts` — domain allowlist validation, rejected domains

---

## Environment Variables

```env
# Required
DATABASE_URL="file:/data/sentinel.db"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
MASTER_KEY="..."  # 32-byte key for AES-256-GCM
```

> **Note**: SMTP and Slack integrations are configured via Admin Settings UI, not env vars. Sensitive values (passwords, webhook URLs) are encrypted using MASTER_KEY before storage.

---

## Deployment

- Docker container with `/data` volume mount
- SQLite embedded (no external DB)
- Run Prisma migrations on startup

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

---

## Implementation Order

1. **Foundation**: Next.js setup, Prisma schema, auth (NextAuth + Google + domain check)
2. **Settings & Lookups**: Org config, seed default lookups (Products, Environments, etc.)
3. **Core Services**: Encryption, RBAC middleware, Audit logging
4. **CRUD Entities**: Customers → Servers → Components → Credentials → Licenses → FirewallRules
5. **Notifications**: License expiry check, Email/Slack integration
6. **Admin Features**: Settings page, Lookup management, Audit log viewer
7. **Polish**: Form validation, error handling, loading states, tests
