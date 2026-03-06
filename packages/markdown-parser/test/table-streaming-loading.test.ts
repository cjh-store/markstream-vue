import { describe, expect, it } from 'vitest'
import { getMarkdown, parseMarkdownToStructure } from '../src'

describe('table streaming loading', () => {
  it('keeps header-only markdown tables in loading state while streaming', () => {
    const md = getMarkdown()
    const nodes = parseMarkdownToStructure(
      '| 编号 | 名称 |\n| --- | --- |',
      md,
      { final: false },
    ) as any[]

    const table = nodes.find(node => node.type === 'table')

    expect(table).toBeTruthy()
    expect(table.loading).toBe(true)
    expect(table.rows).toHaveLength(0)
  })

  it('settles header-only markdown tables when final is true', () => {
    const md = getMarkdown()
    const nodes = parseMarkdownToStructure(
      '| 编号 | 名称 |\n| --- | --- |',
      md,
      { final: true },
    ) as any[]

    const table = nodes.find(node => node.type === 'table')

    expect(table).toBeTruthy()
    expect(table.loading).toBe(false)
    expect(table.rows).toHaveLength(0)
  })
})
