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
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Effects" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="Shdw"
        :model-value="getStyle('boxShadow', node)"
        placeholder="none"
        @update:model-value="emit('style', 'boxShadow', $event)"
      />
      <StyleInput
        label="Blur"
        :model-value="getStyle('filter', node)"
        placeholder="none"
        @update:model-value="emit('style', 'filter', $event)"
      />
      <StyleInput
        label="BkBl"
        :model-value="getStyle('backdropFilter', node)"
        placeholder="none"
        @update:model-value="emit('style', 'backdropFilter', $event)"
      />
      <StyleInput
        label="Tran"
        :model-value="getStyle('transition', node)"
        placeholder="none"
        @update:model-value="emit('style', 'transition', $event)"
      />
      <StyleInput
        label="Tsfm"
        :model-value="getStyle('transform', node)"
        placeholder="none"
        @update:model-value="emit('style', 'transform', $event)"
      />
    </div>
  </div>
</template>
