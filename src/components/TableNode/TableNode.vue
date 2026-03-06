<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import NodeRenderer from '../NodeRenderer'

// 定义单元格节点
interface TableCellNode {
  type: 'table_cell'
  header: boolean
  children: {
    type: string
    raw: string
  }[]
  raw: string
  align?: 'left' | 'right' | 'center'
}

// 定义行节点
interface TableRowNode {
  type: 'table_row'
  cells: TableCellNode[]
  raw: string
}

// 定义表格节点
interface TableNode {
  type: 'table'
  header: TableRowNode
  rows: TableRowNode[]
  raw: string
  loading: boolean
}

// 接收props
const props = defineProps<{
  node: TableNode
  indexKey: string | number
  isDark?: boolean
  typewriter?: boolean
  customId?: string
}>()

// 定义事件
defineEmits(['copy'])

const isLoading = computed(() => props.node.loading ?? false)
const bodyRows = computed(() => props.node.rows ?? [])
const showLoadingIndicator = ref(false)
const LOADING_INDICATOR_DELAY = 120
const LOADING_INDICATOR_MIN_VISIBLE = 120
let enterTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null
let loadingIndicatorVisibleAt = 0
function clearEnterTimer() {
  if (!enterTimer)
    return
  clearTimeout(enterTimer)
  enterTimer = null
}

function clearLeaveTimer() {
  if (!leaveTimer)
    return
  clearTimeout(leaveTimer)
  leaveTimer = null
}

watch(
  isLoading,
  (value) => {
    clearEnterTimer()
    clearLeaveTimer()

    if (value) {
      if (showLoadingIndicator.value)
        return

      enterTimer = setTimeout(() => {
        if (!isLoading.value)
          return
        showLoadingIndicator.value = true
        loadingIndicatorVisibleAt = Date.now()
        enterTimer = null
      }, LOADING_INDICATOR_DELAY)
      return
    }

    if (!showLoadingIndicator.value)
      return

    const elapsed = Date.now() - loadingIndicatorVisibleAt
    const remaining = LOADING_INDICATOR_MIN_VISIBLE - elapsed
    if (remaining <= 0) {
      showLoadingIndicator.value = false
      return
    }

    leaveTimer = setTimeout(() => {
      showLoadingIndicator.value = false
      leaveTimer = null
    }, remaining)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearEnterTimer()
  clearLeaveTimer()
})
</script>

<template>
  <div class="table-node-wrapper">
    <div v-if="isLoading" class="table-node__loading" role="status" aria-live="polite">
      <template v-if="showLoadingIndicator">
        <slot name="loading" :is-loading="isLoading">
          <span class="table-node__spinner animate-spin" aria-hidden="true" />
          <span class="sr-only">Loading</span>
        </slot>
      </template>
    </div>
    <table
      v-else
      class="text-sm table-node"
      :aria-busy="isLoading"
    >
      <thead>
        <tr>
          <th
            v-for="(cell, index) in node.header.cells"
            :key="`header-${index}`"
            dir="auto"
            class="font-semibold p-[8px_12px]"
            :class="[
              cell.align === 'right'
                ? 'text-right'
                : cell.align === 'center'
                  ? 'text-center'
                  : 'text-left',
            ]"
          >
            <NodeRenderer
              :nodes="cell.children"
              :index-key="`table-th-${props.indexKey}`"
              :custom-id="props.customId"
              :typewriter="props.typewriter"
              @copy="$emit('copy', $event)"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in bodyRows"
          :key="`row-${rowIndex}`"
        >
          <td
            v-for="(cell, cellIndex) in row.cells"
            :key="`cell-${rowIndex}-${cellIndex}`"
            class="p-[8px_12px]"
            :class="[
              cell.align === 'right'
                ? 'text-right'
                : cell.align === 'center'
                  ? 'text-center'
                  : 'text-left',
            ]"
            dir="auto"
          >
            <NodeRenderer
              :nodes="cell.children"
              :index-key="`table-td-${props.indexKey}`"
              :custom-id="props.customId"
              :typewriter="props.typewriter"
              @copy="$emit('copy', $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-node-wrapper {
  position: relative;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  overscroll-behavior-y: auto;
  border: 1px solid var(--table-border, #e5e7eb);
  border-radius: 8px;
  margin: 0.75em 0;
}

.table-node-wrapper:has(.table-node__loading) {
  border-color: transparent;
}

.table-node {
  table-layout: auto;
  min-width: 100%;
  width: max-content;
  border-collapse: collapse;
}

.table-node thead {
  background-color: var(--table-header-bg, #f9fafb);
}

.table-node th,
.table-node td {
  border: 1px solid var(--table-border, #e5e7eb);
}

/* 去掉外边缘重复边框，由 wrapper 的 border 负责 */
.table-node tr:first-child th,
.table-node tr:first-child td {
  border-top: none;
}
.table-node tr:last-child th,
.table-node tr:last-child td {
  border-bottom: none;
}
.table-node th:first-child,
.table-node td:first-child {
  border-left: none;
}
.table-node th:last-child,
.table-node td:last-child {
  border-right: none;
}

.table-node :deep(th),
.table-node :deep(td) {
  white-space: nowrap;
  overflow-wrap: break-word;
  word-break: normal;
}

.table-node__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.table-node__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 2px solid rgba(94, 104, 121, 0.25);
  border-top-color: rgba(94, 104, 121, 0.8);
  will-change: transform;
}

/* 表格单元格内的 NodeRenderer 禁用 content-visibility 的占位行为，避免“高但空”的问题 */
:deep(.table-node .markdown-renderer) {
  /* Make the NodeRenderer wrapper behave as if it's not there so
     table cells keep their expected inline/flow layout. */
  display: contents;
  content-visibility: visible;
  contain: content;
  contain-intrinsic-size: 0px 0px;
}

/* Also make internal NodeRenderer wrapper elements layout-transparent
   so they don't introduce block-level boxes inside table cells. */
:deep(.table-node .markdown-renderer .node-slot),
:deep(.table-node .markdown-renderer .node-content),
:deep(.table-node .markdown-renderer .node-space)
{
  display: contents;
}

/* Override the default `break-words` / pre-wrap text styles inside tables so
   dense tables don't turn into vertical glyph stacks. */
:deep(.table-node .text-node),
:deep(.table-node code) {
  white-space: inherit;
  overflow-wrap: inherit;
  word-break: inherit;
  max-width: none;
}

.hr + .table-node-wrapper {
  margin-top: 0;
}

.hr + .table-node-wrapper .table-node {
  margin-top: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
