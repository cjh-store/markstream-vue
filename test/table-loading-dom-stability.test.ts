/**
 * @vitest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import MarkdownRender from '../src/components/NodeRenderer'
import TableNode from '../src/components/TableNode/TableNode.vue'

describe('table loading DOM stability', () => {
  it('keeps the loading table mounted while the separator row streams in', async () => {
    const chunkA = '# H\n\n| A | B |'
    const chunkB = '# H\n\n| A | B |\n|'
    const chunkC = '# H\n\n| A | B |\n| --- | --- |'

    const wrapper = mount(MarkdownRender, {
      props: {
        content: chunkA,
        final: false,
      },
    })

    await nextTick()
    const firstTable = wrapper.findComponent(TableNode)
    expect(firstTable.exists()).toBe(true)
    expect(wrapper.find('.table-node__loading').exists()).toBe(true)
    const firstElement = firstTable.element

    await wrapper.setProps({
      content: chunkB,
      final: false,
    })
    await nextTick()

    const secondTable = wrapper.findComponent(TableNode)
    expect(secondTable.exists()).toBe(true)
    expect(secondTable.element).toBe(firstElement)
    expect(wrapper.find('.table-node__loading').exists()).toBe(true)

    await wrapper.setProps({
      content: chunkC,
      final: false,
    })
    await nextTick()

    const thirdTable = wrapper.findComponent(TableNode)
    expect(thirdTable.exists()).toBe(true)
    expect(thirdTable.element).toBe(firstElement)
  })
})
