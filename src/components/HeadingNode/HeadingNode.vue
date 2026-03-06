<script setup lang="ts">
import { getCustomNodeComponents } from '../../utils/nodeComponents'
import CheckboxNode from '../CheckboxNode'
import EmojiNode from '../EmojiNode'
import EmphasisNode from '../EmphasisNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import HardBreakNode from '../HardBreakNode'
import HighlightNode from '../HighlightNode'
import ImageNode from '../ImageNode'
import InlineCodeNode from '../InlineCodeNode'
import InsertNode from '../InsertNode'
import LinkNode from '../LinkNode'
import { MathInlineNodeAsync } from '../NodeRenderer/asyncComponent'
import ReferenceNode from '../ReferenceNode'
import StrikethroughNode from '../StrikethroughNode'
import StrongNode from '../StrongNode'
import SubscriptNode from '../SubscriptNode'
import SuperscriptNode from '../SuperscriptNode'
import TextNode from '../TextNode'

// Define the type for the node children
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

const props = defineProps<{
  node: {
    type: 'heading'
    level: number
    text: string
    attrs?: Record<string, string | boolean>
    children: NodeChild[]
    raw: string
  }
  customId?: string
  indexKey?: number | string
}>()

const overrides = getCustomNodeComponents(props.customId)

const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  image: ImageNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  checkbox_input: CheckboxNode,
  footnote_reference: FootnoteReferenceNode,
  hardbreak: HardBreakNode,
  math_inline: MathInlineNodeAsync,
  reference: ReferenceNode,
  ...overrides,
}
</script>

<template>
  <component
    :is="`h${node.level}`"
    v-memo="[node.level, node.children, node.attrs]"
    class="heading-node"
    :class="[`heading-${node.level}`]"
    dir="auto"
    v-bind="node.attrs"
  >
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="`${indexKey || 'heading'}-${index}`"
      v-memo="[child]"
      :custom-id="props.customId"
      :node="child"
      :index-key="`${indexKey || 'heading'}-${index}`"
    />
  </component>
</template>

<style scoped>
.heading-node {
  @apply font-medium leading-tight;
}
hr + .heading-node {
  @apply mt-0;
}

.heading-1 {
  @apply mt-0 mb-[0.5em] text-2xl leading-[1.3] font-bold;
}

.heading-2 {
  @apply mt-5 mb-2 text-xl leading-[1.3] font-bold;
}

.heading-3 {
  @apply mt-4 mb-1.5 text-lg font-semibold leading-[1.4];
}

.heading-4 {
  @apply mt-3 mb-1 text-base font-semibold;
}

.heading-5 {
  @apply m-0 text-sm;
}

.heading-6 {
  @apply m-0 text-sm;
}
</style>
