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
      <div class="flex gap-1.5">
        <label class="flex min-w-0 flex-1 items-center gap-1.5">
          <span class="w-8 shrink-0 text-[11px] text-[#a6adc8]">Width</span>
          <input
            class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
            :value="getStyle('borderWidth', node)"
            placeholder="0"
            @change="emit('style', 'borderWidth', ($event.target as HTMLInputElement).value)"
          >
        </label>
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
