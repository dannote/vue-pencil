<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import ScrubInput from '@/components/ScrubInput.vue'
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

function parsePx(v: string, fallback: number): number {
  const n = parseFloat(v)
  return Number.isNaN(n) ? fallback : n
}

const TEXT_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'a', 'li', 'em', 'strong', 'b', 'i', 'u', 'small', 'blockquote', 'figcaption'])

const weightOptions = [
  { value: '', label: '–' },
  { value: '100', label: '100 Thin' },
  { value: '200', label: '200 Extra Light' },
  { value: '300', label: '300 Light' },
  { value: '400', label: '400 Normal' },
  { value: '500', label: '500 Medium' },
  { value: '600', label: '600 Semi Bold' },
  { value: '700', label: '700 Bold' },
  { value: '800', label: '800 Extra Bold' },
  { value: '900', label: '900 Black' },
]

const alignOptions = [
  { value: '', label: '–' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
]

const decorationOptions = [
  { value: '', label: '–' },
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' },
  { value: 'overline', label: 'Overline' },
]

const transformOptions = [
  { value: '', label: '–' },
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPER' },
  { value: 'lowercase', label: 'lower' },
  { value: 'capitalize', label: 'Capitalize' },
]

function isTextNode(node: DesignNode): boolean {
  return TEXT_TAGS.has(node.type)
}
</script>

<template>
  <div v-if="isTextNode(node)" class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Typography" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="Font"
        :model-value="getStyle('fontFamily', node)"
        placeholder="inherit"
        @update:model-value="emit('style', 'fontFamily', $event)"
      />
      <div class="flex gap-1.5">
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <span class="w-4 shrink-0 text-[11px] text-[#a6adc8]">Sz</span>
          <ScrubInput
            :model-value="parsePx(getStyle('fontSize', node), 16)"
            :min="1"
            suffix="px"
            @update:model-value="emit('style', 'fontSize', `${$event}px`)"
          />
        </div>
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <span class="w-4 shrink-0 text-[11px] text-[#a6adc8]">LH</span>
          <ScrubInput
            :model-value="parsePx(getStyle('lineHeight', node), 1.5)"
            :min="0"
            :step="0.1"
            :sensitivity="0.05"
            @update:model-value="emit('style', 'lineHeight', String($event))"
          />
        </div>
      </div>
      <StyleInput
        label="Wt"
        type="select"
        :model-value="getStyle('fontWeight', node)"
        :options="weightOptions"
        @update:model-value="emit('style', 'fontWeight', $event)"
      />
      <StyleInput
        label="Spc"
        :model-value="getStyle('letterSpacing', node)"
        placeholder="normal"
        @update:model-value="emit('style', 'letterSpacing', $event)"
      />
      <StyleInput
        label="Algn"
        type="select"
        :model-value="getStyle('textAlign', node)"
        :options="alignOptions"
        @update:model-value="emit('style', 'textAlign', $event)"
      />
      <StyleInput
        label="Deco"
        type="select"
        :model-value="getStyle('textDecoration', node)"
        :options="decorationOptions"
        @update:model-value="emit('style', 'textDecoration', $event)"
      />
      <StyleInput
        label="Case"
        type="select"
        :model-value="getStyle('textTransform', node)"
        :options="transformOptions"
        @update:model-value="emit('style', 'textTransform', $event)"
      />
      <StyleInput
        label="Color"
        type="color"
        :model-value="getStyle('color', node)"
        @update:model-value="emit('style', 'color', $event)"
      />
    </div>
  </div>
</template>
