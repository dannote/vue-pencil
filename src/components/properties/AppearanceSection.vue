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
    <SectionHeader title="Appearance" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="Opac"
        :model-value="getStyle('opacity', node)"
        placeholder="1"
        @update:model-value="emit('style', 'opacity', $event)"
      />
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
