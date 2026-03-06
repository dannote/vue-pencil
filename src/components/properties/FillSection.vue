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

function getBg(node: DesignNode): string {
  return getStyle('background', node) || getStyle('backgroundColor', node)
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Fill" />
    <div class="flex flex-col gap-1.5">
      <StyleInput
        label="BG"
        type="color"
        :model-value="getBg(node)"
        @update:model-value="emit('style', 'background', $event)"
      />
    </div>
  </div>
</template>
