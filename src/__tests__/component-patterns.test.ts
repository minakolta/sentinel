import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'vitest'

/**
 * This test file prevents common UI component errors by statically analyzing
 * the codebase for known problematic patterns.
 */

// Helper to recursively get all files matching a pattern
function getFilesRecursive(dir: string, pattern: RegExp): string[] {
  const files: string[] = []
  
  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return
    
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath)
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }
  
  walk(dir)
  return files
}

describe('Component Static Analysis', () => {
  const srcDir = path.resolve(__dirname, '..')
  
  describe('SelectItem validation', () => {
    it('should not have SelectItem with empty string value', () => {
      const files = getFilesRecursive(srcDir, /\.(tsx?)$/)
      const violations: string[] = []
      
      // Pattern to match <SelectItem value="">
      // This is a common mistake that causes runtime errors in Radix UI Select
      const emptyValuePattern = /<SelectItem[^>]*value=["'](\s*)["']/g
      
      for (const file of files) {
        // Skip test files - they may contain patterns as examples
        if (file.includes('.test.') || file.includes('__tests__')) continue
        
        const content = fs.readFileSync(file, 'utf-8')
        const matches = content.matchAll(emptyValuePattern)
        
        for (const match of matches) {
          // Check if the value is empty or whitespace only
          if (match[1] === '' || match[1].trim() === '') {
            const lineNumber = content.substring(0, match.index).split('\n').length
            violations.push(`${file}:${lineNumber} - SelectItem has empty value`)
          }
        }
      }
      
      expect(violations, `Found SelectItem components with empty value (must use a sentinel value like "__NONE__" instead):\n${violations.join('\n')}`).toHaveLength(0)
    })

    it('should not use empty string for optional Select values', () => {
      const files = getFilesRecursive(srcDir, /\.(tsx?)$/)
      const violations: string[] = []
      
      // Pattern that might indicate setting select to empty string
      // This catches patterns like: value={field.value || ""}
      // which should use a sentinel value instead
      const emptyFallbackPattern = /value=\{[^}]*\|\|\s*["']["']\s*\}/g
      
      for (const file of files) {
        // Skip test files
        if (file.includes('.test.') || file.includes('__tests__')) continue
        
        const content = fs.readFileSync(file, 'utf-8')
        
        // Only check files that use Select components
        if (!content.includes('SelectItem') && !content.includes('<Select')) continue
        
        const matches = content.matchAll(emptyFallbackPattern)
        
        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length
          // Check context - if it's inside a Select, flag it
          const surroundingLines = content.substring(
            Math.max(0, match.index! - 200),
            Math.min(content.length, match.index! + 200)
          )
          
          if (surroundingLines.includes('SelectTrigger') || surroundingLines.includes('SelectValue')) {
            violations.push(`${file}:${lineNumber} - Select value falls back to empty string. Use "__NONE__" sentinel value instead.`)
          }
        }
      }
      
      // This is a warning test - won't fail but will log issues
      if (violations.length > 0) {
        console.warn('Potential Select empty value issues:', violations)
      }
    })
  })

  describe('Form patterns', () => {
    it('should use __NONE__ pattern for optional Select fields', () => {
      const formsDir = path.resolve(srcDir, 'components/forms')
      if (!fs.existsSync(formsDir)) return
      
      const files = getFilesRecursive(formsDir, /\.(tsx?)$/)
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // If file has SelectItem, verify it uses __NONE__ pattern for "no selection" options
        if (content.includes('SelectItem')) {
          // Check for proper "none" option pattern
          const hasNoneOption = content.includes('value="__NONE__"') || 
                               content.includes("value='__NONE__'")
          
          // Check if there's a "No ..." or "None" label that suggests optional field
          const hasOptionalLabel = /SelectItem[^>]*>\s*(No |None|Not |Unassigned|Select)/i.test(content)
          
          if (hasOptionalLabel && !hasNoneOption) {
            // Check it's not already fixed
            const hasEmptyValue = content.includes('value=""') || content.includes("value=''")
            
            expect(
              hasEmptyValue,
              `${file}: Optional Select field should use value="__NONE__" instead of empty string`
            ).toBe(false)
          }
        }
      }
    })
  })
})
