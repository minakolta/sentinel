import { describe, it, expect } from 'vitest'
import {
  customerFormSchema,
  projectSchema,
  serverSchema,
  licenseSchema,
  credentialSchema,
  firewallRuleSchema,
} from '@/lib/validations/entities'

describe('Form Validation Schemas', () => {
  describe('customerFormSchema', () => {
    it('should validate valid customer data', () => {
      const validData = {
        name: 'Acme Corporation',
        code: 'ACME',
        contacts: [],
        projectManagers: [],
      }
      
      const result = customerFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        code: 'ACME',
        contacts: [],
        projectManagers: [],
      }
      
      const result = customerFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty code', () => {
      const invalidData = {
        name: 'Acme Corporation',
        code: '',
        contacts: [],
        projectManagers: [],
      }
      
      const result = customerFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('projectSchema', () => {
    it('should validate valid project data', () => {
      const validData = {
        name: 'Cloud Migration',
        description: 'Migrate to cloud',
        customerId: 'cust-123',
        ownerId: null,
      }
      
      const result = projectSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow null ownerId for optional owner', () => {
      const validData = {
        name: 'Cloud Migration',
        customerId: 'cust-123',
        ownerId: null,
      }
      
      const result = projectSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty customerId', () => {
      const invalidData = {
        name: 'Cloud Migration',
        customerId: '',
        ownerId: null,
      }
      
      const result = projectSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('serverSchema', () => {
    it('should validate valid server data', () => {
      const validData = {
        hostname: 'server-01.example.com',
        ip: '192.168.1.100',
        role: 'Web Server',
        customerId: 'cust-123',
        osId: 'os-123',
        environmentId: 'env-123',
      }
      
      const result = serverSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow role to be null/empty', () => {
      const validData = {
        hostname: 'server-01.example.com',
        ip: '192.168.1.100',
        role: null,
        customerId: 'cust-123',
        osId: 'os-123',
        environmentId: 'env-123',
      }
      
      const result = serverSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty hostname', () => {
      const invalidData = {
        hostname: '',
        ip: '192.168.1.100',
        customerId: 'cust-123',
        osId: 'os-123',
        environmentId: 'env-123',
      }
      
      const result = serverSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require valid IP address', () => {
      const invalidData = {
        hostname: 'server-01',
        ip: 'not-an-ip',
        customerId: 'cust-123',
        osId: 'os-123',
        environmentId: 'env-123',
      }
      
      const result = serverSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require osId and environmentId', () => {
      const missingOs = {
        hostname: 'server-01',
        ip: '192.168.1.100',
        customerId: 'cust-123',
        osId: '',
        environmentId: 'env-123',
      }
      
      const missingEnv = {
        hostname: 'server-01',
        ip: '192.168.1.100',
        customerId: 'cust-123',
        osId: 'os-123',
        environmentId: '',
      }
      
      expect(serverSchema.safeParse(missingOs).success).toBe(false)
      expect(serverSchema.safeParse(missingEnv).success).toBe(false)
    })
  })

  describe('licenseSchema', () => {
    it('should validate valid license data', () => {
      const validData = {
        customerId: 'cust-123',
        productId: 'prod-123',
        typeId: 'type-123',
        environmentId: 'env-123',
        value: 'license-key-value',
        expiresAt: '2025-12-31',
        notes: 'Test notes',
      }
      
      const result = licenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        customerId: '',
        productId: '',
        typeId: '',
        environmentId: '',
      }
      
      const result = licenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('credentialSchema', () => {
    it('should validate valid credential data', () => {
      const validData = {
        customerId: 'cust-123',
        serverId: null,
        username: 'admin',
        secret: 'password123',
        url: 'https://example.com',
        notes: 'Test notes',
      }
      
      const result = credentialSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow null serverId for credentials without server', () => {
      const validData = {
        customerId: 'cust-123',
        serverId: null,
        username: 'admin',
        secret: 'password123',
      }
      
      const result = credentialSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL', () => {
      const invalidData = {
        customerId: 'cust-123',
        username: 'admin',
        secret: 'password123',
        url: 'not-a-valid-url',
      }
      
      const result = credentialSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow empty URL', () => {
      const validData = {
        customerId: 'cust-123',
        username: 'admin',
        secret: 'password123',
        url: '',
      }
      
      const result = credentialSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('firewallRuleSchema', () => {
    it('should validate valid firewall rule data', () => {
      const validData = {
        customerId: 'cust-123',
        srcRole: 'Web Server',
        srcIp: '10.0.0.0/24',
        dstRole: 'Database',
        dstIp: '10.0.1.0/24',
        port: 3306,
        protocol: 'TCP' as const,
        comment: 'Allow DB access',
      }
      
      const result = firewallRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate IP address format', () => {
      const validData = {
        customerId: 'cust-123',
        srcIp: '192.168.1.1',
        dstIp: '10.0.0.1',
        port: 443,
        protocol: 'TCP' as const,
      }
      
      const result = firewallRuleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid IP format', () => {
      const invalidData = {
        customerId: 'cust-123',
        srcIp: 'not-an-ip',
        dstIp: '10.0.0.1',
        port: 443,
        protocol: 'TCP' as const,
      }
      
      const result = firewallRuleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate port range', () => {
      const invalidLowPort = {
        customerId: 'cust-123',
        srcIp: '10.0.0.1',
        dstIp: '10.0.0.2',
        port: 0,
        protocol: 'TCP' as const,
      }
      
      const invalidHighPort = {
        customerId: 'cust-123',
        srcIp: '10.0.0.1',
        dstIp: '10.0.0.2',
        port: 70000,
        protocol: 'TCP' as const,
      }
      
      expect(firewallRuleSchema.safeParse(invalidLowPort).success).toBe(false)
      expect(firewallRuleSchema.safeParse(invalidHighPort).success).toBe(false)
    })

    it('should only accept TCP or UDP protocol', () => {
      const tcpData = {
        customerId: 'cust-123',
        srcIp: '10.0.0.1',
        dstIp: '10.0.0.2',
        port: 443,
        protocol: 'TCP' as const,
      }
      
      const udpData = {
        customerId: 'cust-123',
        srcIp: '10.0.0.1',
        dstIp: '10.0.0.2',
        port: 53,
        protocol: 'UDP' as const,
      }
      
      expect(firewallRuleSchema.safeParse(tcpData).success).toBe(true)
      expect(firewallRuleSchema.safeParse(udpData).success).toBe(true)
    })
  })
})
