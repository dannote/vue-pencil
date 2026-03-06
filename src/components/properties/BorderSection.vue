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

const styleOptions = [
  { value: '', label: '–' },
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
]
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Border" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="Color"
        type="color"
        :model-value="getStyle('borderColor', node)"
        @update:model-value="emit('style', 'borderColor', $event)"
      />
      <div class="flex items-center gap-2">
        <span class="w-8 shrink-0 text-[11px] text-[#a6adc8]">Width</span>
        <ScrubInput
          :model-value="parsePx(getStyle('borderWidth', node), 0)"
          :min="0"
          suffix="px"
          @update:model-value="emit('style', 'borderWidth', `${$event}px`)"
        />
      </div>
      <StyleInput
        label="Style"
        type="select"
        :model-value="getStyle('borderStyle', node)"
        :options="styleOptions"
        @update:model-value="emit('style', 'borderStyle', $event)"
      />
    </div>
  </div>
</template>
