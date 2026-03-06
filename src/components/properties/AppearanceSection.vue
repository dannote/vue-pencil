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

function parseNum(v: string, fallback: number): number {
  const n = parseFloat(v)
  return Number.isNaN(n) ? fallback : n
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Appearance" />
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <span class="w-8 shrink-0 text-[11px] text-[#a6adc8]">Opac</span>
        <ScrubInput
          :model-value="parseNum(getStyle('opacity', node), 1)"
          :min="0"
          :max="1"
          :step="0.01"
          :sensitivity="0.01"
          @update:model-value="emit('style', 'opacity', String($event))"
        />
      </div>
      <StyleInput
        label="Rad"
        :model-value="getStyle('borderRadius', node)"
        placeholder="0"
        @update:model-value="emit('style', 'borderRadius', $event)"
      />
      <StyleInput
        label="Cur"
        :model-value="getStyle('cursor', node)"
        placeholder="auto"
        @update:model-value="emit('style', 'cursor', $event)"
      />
    </div>
  </div>
</template>
