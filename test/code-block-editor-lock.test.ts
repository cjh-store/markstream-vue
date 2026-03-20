import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CodeBlockNode from '../src/components/CodeBlockNode/CodeBlockNode.vue'

interface StreamMonacoHelpers {
  createEditor: ReturnType<typeof vi.fn>
  createDiffEditor: ReturnType<typeof vi.fn>
  updateCode: ReturnType<typeof vi.fn>
  updateDiff: ReturnType<typeof vi.fn>
  getEditor: ReturnType<typeof vi.fn>
  getEditorView: ReturnType<typeof vi.fn>
  getDiffEditorView: ReturnType<typeof vi.fn>
  cleanupEditor: ReturnType<typeof vi.fn>
  safeClean: ReturnType<typeof vi.fn>
  setTheme: ReturnType<typeof vi.fn>
}

function getStreamMonacoHelpers(): StreamMonacoHelpers {
  return (globalThis as any).__streamMonacoHelpers
}

function resetStreamMonacoHelpers() {
  const helpers = getStreamMonacoHelpers()
  const makeEditorView = () => ({
    getModel: () => ({ getLineCount: () => 1 }),
    getOption: () => 14,
    updateOptions: vi.fn(),
    layout: vi.fn(),
  })

  helpers.createEditor.mockReset().mockImplementation(async () => {})
  helpers.createDiffEditor.mockReset().mockImplementation(async () => {})
  helpers.updateCode.mockReset()
  helpers.updateDiff.mockReset()
  helpers.getEditor.mockReset().mockImplementation(() => null)
  helpers.getEditorView.mockReset().mockReturnValue(makeEditorView())
  helpers.getDiffEditorView.mockReset().mockReturnValue(makeEditorView())
  helpers.cleanupEditor.mockReset().mockImplementation(() => {})
  helpers.safeClean.mockReset().mockImplementation(() => {})
  helpers.setTheme.mockReset().mockImplementation(async () => {})
}

async function flushPendingMicrotasks() {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

async function waitForCreateEditorCalls(expected: number, helpers: StreamMonacoHelpers, timeout = 1000) {
  const start = Date.now()
  while (helpers.createEditor.mock.calls.length < expected) {
    if (Date.now() - start > timeout)
      throw new Error('Timed out waiting for createEditor call')
    await flushPendingMicrotasks()
  }
}

describe('codeBlockNode editor creation locking', () => {
  beforeEach(() => {
    resetStreamMonacoHelpers()
  })

  it('renders a `<pre>` fallback until Monaco finishes mounting', async () => {
    const helpers = getStreamMonacoHelpers()
    let resolveCreate: (() => void) | null = null
    helpers.createEditor.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = () => resolve()
        }),
    )

    const wrapper = mount(CodeBlockNode, {
      props: {
        node: {
          type: 'code_block',
          language: 'js',
          code: 'console.log(1)',
          raw: '```js\nconsole.log(1)\n```',
        },
        loading: true,
        stream: true,
        showHeader: false,
      },
    })

    await flushPendingMicrotasks()
    await waitForCreateEditorCalls(1, helpers)

    expect(wrapper.find('pre.code-pre-fallback').exists()).toBe(true)
    expect(wrapper.find('.code-editor-container').classes()).toContain('is-hidden')

    const finish = resolveCreate
    if (finish)
      finish()
    await flushPendingMicrotasks()

    expect(wrapper.find('pre.code-pre-fallback').exists()).toBe(false)
    expect(wrapper.find('.code-editor-container').classes()).not.toContain('is-hidden')

    wrapper.unmount()
  })

  it('invokes createEditor only once while loading toggles mid-creation', async () => {
    const helpers = getStreamMonacoHelpers()
    let resolveCreate: (() => void) | null = null
    helpers.createEditor.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = () => resolve()
        }),
    )

    const wrapper = mount(CodeBlockNode, {
      props: {
        node: {
          type: 'code_block',
          language: 'js',
          code: 'console.log(1)',
          raw: '```js\nconsole.log(1)\n```',
        },
        loading: true,
        stream: true,
        showHeader: false,
      },
    })

    await flushPendingMicrotasks()
    expect(wrapper.find('.code-editor-container').exists()).toBe(true)

    await waitForCreateEditorCalls(1, helpers)

    await wrapper.setProps({ loading: false })
    await flushPendingMicrotasks()
    expect(helpers.createEditor).toHaveBeenCalledTimes(1)

    const finish = resolveCreate
    if (finish)
      finish()
    await flushPendingMicrotasks()
    wrapper.unmount()
  })
})

describe('codeBlockNode language normalization', () => {
  beforeEach(() => {
    resetStreamMonacoHelpers()
  })

  it('normalizes js aliases before invoking Monaco helpers', async () => {
    const helpers = getStreamMonacoHelpers()

    const wrapper = mount(CodeBlockNode, {
      props: {
        node: {
          type: 'code_block',
          language: 'js',
          code: 'console.log(1)',
          raw: '```js\nconsole.log(1)\n```',
        },
        loading: false,
      },
    })

    await waitForCreateEditorCalls(1, helpers)

    const createArgs = helpers.createEditor.mock.calls[0]
    expect(createArgs[2]).toBe('javascript')

    wrapper.unmount()
  })
})

describe('codeBlockNode diff defaults', () => {
  beforeEach(() => {
    resetStreamMonacoHelpers()
  })

  async function waitForCreateDiffEditorCalls(expected: number, helpers: StreamMonacoHelpers, timeout = 1000) {
    const start = Date.now()
    while (helpers.createDiffEditor.mock.calls.length < expected) {
      if (Date.now() - start > timeout)
        throw new Error('Timed out waiting for createDiffEditor call')
      await flushPendingMicrotasks()
    }
  }

  it('recreates diff editors when loading transitions from true to false', async () => {
    const helpers = getStreamMonacoHelpers()

    const wrapper = mount(CodeBlockNode, {
      props: {
        node: {
          type: 'code_block',
          language: 'diff',
          code: '@@ -1 +1 @@',
          diff: true,
          originalCode: 'const a = 1\\nconst b = 2\\n',
          updatedCode: 'const a = 1\\nconst c = 3\\n',
          raw: '```diff\\n-const b = 2\\n+const c = 3\\n```',
        },
        loading: true,
        stream: true,
        showHeader: false,
      },
    })

    await waitForCreateDiffEditorCalls(1, helpers)
    await flushPendingMicrotasks()

    helpers.createDiffEditor.mockClear()

    await wrapper.setProps({ loading: false })
    await waitForCreateDiffEditorCalls(1, helpers)

    expect(helpers.createDiffEditor).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
