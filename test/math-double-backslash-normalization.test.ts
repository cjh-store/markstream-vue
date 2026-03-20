import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'

function collectByType(nodes: any, type: string, out: any[] = []) {
  if (!nodes)
    return out
  if (Array.isArray(nodes)) {
    for (const node of nodes)
      collectByType(node, type, out)
    return out
  }
  if (nodes.type === type)
    out.push(nodes)
  if (Array.isArray(nodes.children))
    nodes.children.forEach((child: any) => collectByType(child, type, out))
  return out
}

describe('math normalization for doubled backslashes', () => {
  it('normalizes doubled TeX command prefixes in inline and block math', () => {
    const md = getMarkdown('double-backslash-math')
    const markdown = String.raw`行内公式 $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$。

$$
\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}
$$`

    const nodes = parseMarkdownToStructure(markdown, md, { final: true })
    const inlineMath = collectByType(nodes, 'math_inline')
    const blockMath = collectByType(nodes, 'math_block')

    expect(inlineMath).toHaveLength(1)
    expect(blockMath).toHaveLength(1)
    expect(inlineMath[0].content).toContain(String.raw`\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`)
    expect(inlineMath[0].content).not.toContain(String.raw`\\frac`)
    expect(blockMath[0].content).toContain(String.raw`\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}`)
    expect(blockMath[0].content).not.toContain(String.raw`\\nabla`)
  })
})
