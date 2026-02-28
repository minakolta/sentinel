# Sentinel — Copilot Instructions

Multi-tenant infrastructure & license tracking system. Fully configurable via admin UI, no hardcoded business logic. Focus on security, auditability, and modern, intuitive UX.

## Look and Feel
- Extremely user-friendly with modern, clean design
- Use shadcn/ui components and TailwindCSS
- Usability is paramount with clear navigation and consistent patterns

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict, no `any`) |
| Styling | TailwindCSS + shadcn/ui |
| Database | SQLite via Prisma (`./data/sentinel.db`) |
| Auth | NextAuth.js (Google Provider, domain-restricted) |
| Testing | Vitest (≥80% coverage) |

---

## MCP Tools

### Context7 
Use for understanding libraries and discovering relevant code patterns.

### GitHub (Issue Tracking)
Track progress and manage tasks. Create issues for new features, bugs, or improvements.

---

## UI/UX Standards

### Design Principles
1. **Modern & Clean**: shadcn/ui components, TailwindCSS
2. **Consistent Layout**: TopNav, consistent spacing, unified form styles
3. **Visual Hierarchy**: Clear headings, subtle borders, proper contrast
4. **Responsive**: Mobile-first, works on all screen sizes

### Layout Patterns
- **TopNav**: Global navigation with active state indicators (sky-500 underline)
- **Page Header**: Title + description for context
- **Content Area**: Consistent max-width container
- **Dialogs**: For create/edit forms and confirmations
- **Tabs**: For related views (e.g., Server details: Info, Components)

### Component Guidelines
- Reusable components across entities (e.g., \`EntityForm\`, \`DataTable\`)
- Use shadcn/ui for form controls, tables, dialogs
- Custom styling via Tailwind for spacing, colors, typography

---

## Project Structure

\`\`\`
/app
  /(auth)/login
  /(dashboard)/
    /customers
    /projects
    /servers
    /licenses
    /credentials
    /firewall-rules
    /audit-logs         # ADMIN only
    /settings           # ADMIN only
  /api
    /auth/[...nextauth]
    /customers
    /projects
    /servers
    /licenses
    /credentials
    /firewall-rules
    /audit-logs
    /entities/[type]    # CRUD for lookup tables
    /users
    /settings
    /branding
/components
  /ui                   # shadcn components
  /forms                # Entity forms with Zod validation
  /tables               # DataTable with sorting/filtering
  /layout               # TopNav, PageHeader, PageContainer, Providers
/lib
  /db.ts                # Prisma client singleton
  /auth.ts              # NextAuth config + RBAC
  /validations          # Zod schemas
  /branding.tsx         # Branding context
/server
  /services             # Business logic
/src
  /__tests__            # Vitest test files
/prisma
  /schema.prisma
  /migrations
\`\`\`

---

## Data Model

### Lookup Tables (admin-configurable)
- **Product**: id, name
- **Environment**: id, name, order
- **OperatingSystem**: id, name
- **ComponentType**: id, name
- **LicenseType**: id, name, isJwt

### Core Entities

| Entity | Key Fields |
|--------|------------|
| **User** | id, email, name, role (String: "ADMIN"/"USER"), image |
| **Customer** | id, name, code, contacts (JSON string), projectManagers (JSON string) |
| **Project** | id, name, description, customerId, ownerId |
| **Server** | id, customerId, hostname, ip, osId, role, environmentId |
| **Component** | id, serverId, typeId |
| **License** | id, customerId, productId, typeId, environmentId, encryptedValue, expiresAt, notes |
| **Credential** | id, customerId, serverId?, username, encryptedSecret, url?, notes? |
| **FirewallRule** | id, customerId, srcRole, srcIp, dstRole, dstIp, port, protocol (String: "TCP"/"UDP"), comment? |
| **AuditLog** | id, userId, entity, entityId, action, before, after, timestamp |
| **NotificationLog** | id, licenseId, channel, sentAt, daysBeforeExpiry |
| **Setting** | id, key, value (String) |

### Relations
\`\`\`
Customer
  → hasMany: Projects, Servers, Licenses, Credentials, FirewallRules

Project
  → belongsTo: Customer
  → belongsTo: User (owner, optional)

Server
  → belongsTo: Customer, OperatingSystem, Environment
  → hasMany: Components, Credentials

License
  → belongsTo: Customer, Product, LicenseType, Environment
  → hasMany: NotificationLogs

Component
  → belongsTo: Server, ComponentType

Credential
  → belongsTo: Customer
  → belongsTo: Server (optional)

FirewallRule
  → belongsTo: Customer

AuditLog
  → belongsTo: User

User
  → hasMany: AuditLogs, Projects (as owner)
\`\`\`

---

## Security

### Domain-Restricted Auth
Check email domain against \`Setting("org.allowedDomains")\` on sign-in.

### Encryption
AES-256-GCM with MASTER_KEY from env for sensitive data.

### RBAC
| Role | Permissions |
|------|-------------|
| ADMIN | Full access including Settings, Entities, Audit Logs |
| USER | CRUD on Customers, Projects, Servers, Licenses, Credentials, FirewallRules |

---

## License Expiry Alerts

- Alert windows configurable via Settings (default: \`[60, 30, 14, 7, 3, 1]\` days)
- Check daily via cron/scheduled job
- Log to NotificationLog, deduplicate by (licenseId + daysBeforeExpiry)

---

## Environment Variables

\`\`\`env
DATABASE_URL="file:./data/sentinel.db"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
MASTER_KEY="..."  # 32-byte key for AES-256-GCM
\`\`\`

---

## Code Practices

1. **TypeScript**: No \`any\`, use precise types
2. **Separation**: Business logic in services, UI in components
3. **Error Handling**: Graceful states, user-friendly messages
4. **Testing**: Vitest for critical logic
5. **Security**: Auth, encryption, input validation

---

## Testing

### Commands
\`\`\`bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:coverage  # With coverage report
\`\`\`

### Test Structure
- \`/src/__tests__/\` - Test files
- \`vitest.config.ts\` - Vitest configuration
- \`vitest.setup.ts\` - Test setup and cleanup
- 80% coverage threshold enforced

### Test Types
- **Validation tests**: Zod schema validation (\`validations.test.ts\`)
- **Pattern tests**: Static analysis for anti-patterns (\`component-patterns.test.ts\`)

---

## Component Conventions

### Select with Optional Values (\`__NONE__\` Pattern)

Radix UI Select does not allow empty string values. For optional Select fields, use the \`__NONE__\` sentinel value:

\`\`\`tsx
// ❌ WRONG - causes runtime error
<SelectItem value="">No owner</SelectItem>

// ✅ CORRECT - use __NONE__ sentinel
<Select
  value={field.value || "__NONE__"}
  onValueChange={(v) => field.onChange(v === "__NONE__" ? null : v)}
>
  <SelectItem value="__NONE__">No owner</SelectItem>
  <SelectItem value="user-123">John Doe</SelectItem>
</Select>
\`\`\`

This pattern is enforced by static analysis tests.