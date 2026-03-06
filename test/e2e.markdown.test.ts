import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'

const md = getMarkdown('e2e')

const FIXTURES_DIR = resolve(__dirname, 'fixtures')

describe('e2e markdown parsing (fixtures)', () => {
  const files = [
    'headings.md',
    'code-diff.md',
    'table.md',
    'admonition.md',
    'math.md',
    'footnotes.md',
    'image-link.md',
    'checkbox.md',
    'mermaid.md',
    // edge-case fixtures
    'unclosed-fence.md',
    'trailing-backticks.md',
    'unmatched-brackets.md',
    'escaped-brackets.md',
    'nested-lists-edge.md',
    'fence-with-meta.md',
  ]

  for (const f of files) {
    it(`parses fixture ${f}`, () => {
      const src = readFileSync(resolve(FIXTURES_DIR, f), 'utf8')
      const nodes = parseMarkdownToStructure(src, md)
      expect(nodes).toBeInstanceOf(Array)
      // Ensure we have at least one top-level node
      expect(nodes.length).toBeGreaterThan(0)
    })
  }
})
