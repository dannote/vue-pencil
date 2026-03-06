<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import SectionHeader from './SectionHeader.vue'
import StyleInput from './StyleInput.vue'

defineProps<{
  node: DesignNode
}>()

const emit = defineEmits<{
  style: [prop: string, value: string]
}>()

function getStyle(prop: string, node: DesignNode): string {
  return node.props.style?.[prop] ?? ''
}

const displayOptions = [
  { value: '', label: '–' },
  { value: 'block', label: 'Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline', label: 'Inline' },
  { value: 'inline-block', label: 'Inline Block' },
  { value: 'none', label: 'None' },
]

const directionOptions = [
  { value: '', label: '–' },
  { value: 'row', label: 'Row' },
  { value: 'row-reverse', label: 'Row Rev.' },
  { value: 'column', label: 'Column' },
  { value: 'column-reverse', label: 'Col. Rev.' },
]

const justifyOptions = [
  { value: '', label: '–' },
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'space-between', label: 'Between' },
  { value: 'space-around', label: 'Around' },
  { value: 'space-evenly', label: 'Evenly' },
]

const alignOptions = [
  { value: '', label: '–' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'baseline', label: 'Baseline' },
]

const wrapOptions = [
  { value: '', label: '–' },
  { value: 'nowrap', label: 'No Wrap' },
  { value: 'wrap', label: 'Wrap' },
]

const overflowOptions = [
  { value: '', label: '–' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' },
]

function isFlex(node: DesignNode): boolean {
  const d = node.props.style?.display
  return d === 'flex' || d === 'inline-flex'
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Layout" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="Disp"
        type="select"
        :model-value="getStyle('display', node)"
        :options="displayOptions"
        @update:model-value="emit('style', 'display', $event)"
      />
      <template v-if="isFlex(node)">
        <StyleInput
          label="Dir"
          type="select"
          :model-value="getStyle('flexDirection', node)"
          :options="directionOptions"
          @update:model-value="emit('style', 'flexDirection', $event)"
        />
        <StyleInput
          label="Just"
          type="select"
          :model-value="getStyle('justifyContent', node)"
          :options="justifyOptions"
          @update:model-value="emit('style', 'justifyContent', $event)"
        />
        <StyleInput
          label="Algn"
          type="select"
          :model-value="getStyle('alignItems', node)"
          :options="alignOptions"
          @update:model-value="emit('style', 'alignItems', $event)"
        />
        <StyleInput
          label="Wrap"
          type="select"
          :model-value="getStyle('flexWrap', node)"
          :options="wrapOptions"
          @update:model-value="emit('style', 'flexWrap', $event)"
        />
        <StyleInput
          label="Gap"
          :model-value="getStyle('gap', node)"
          placeholder="0"
          @update:model-value="emit('style', 'gap', $event)"
        />
      </template>
      <StyleInput
        label="Pad"
        :model-value="getStyle('padding', node)"
        placeholder="0"
        @update:model-value="emit('style', 'padding', $event)"
      />
      <StyleInput
        label="Oflw"
        type="select"
        :model-value="getStyle('overflow', node)"
        :options="overflowOptions"
        @update:model-value="emit('style', 'overflow', $event)"
      />
    </div>
  </div>
</template>
