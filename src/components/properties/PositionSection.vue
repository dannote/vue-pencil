<script setup lang="ts">
import type { DesignNode, FrameLayout } from '@/model/types'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
  layout: FrameLayout | null
}>()

const emit = defineEmits<{
  style: [prop: string, value: string]
  frame: [prop: keyof FrameLayout, value: number]
}>()

function onFrameChange(prop: keyof FrameLayout, raw: string) {
  const num = parseFloat(raw)
  if (!isNaN(num)) emit('frame', prop, num)
}

function onStyleChange(prop: string, raw: string) {
  emit('style', prop, raw)
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Position" />
    <div v-if="layout" class="grid grid-cols-2 gap-x-3 gap-y-1.5">
      <label v-for="prop in (['x', 'y'] as const)" :key="prop" class="flex items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">{{ prop.toUpperCase() }}</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          type="number"
          :value="Math.round(layout[prop])"
          @change="onFrameChange(prop, ($event.target as HTMLInputElement).value)"
        >
      </label>
      <label v-for="prop in (['width', 'height'] as const)" :key="prop" class="flex items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">{{ prop === 'width' ? 'W' : 'H' }}</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          type="number"
          :value="Math.round(layout[prop])"
          @change="onFrameChange(prop, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
    <div v-else class="grid grid-cols-2 gap-x-3 gap-y-1.5">
      <label class="flex items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">W</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          :value="node.props.style?.width ?? ''"
          placeholder="auto"
          @change="onStyleChange('width', ($event.target as HTMLInputElement).value)"
        >
      </label>
      <label class="flex items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">H</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          :value="node.props.style?.height ?? ''"
          placeholder="auto"
          @change="onStyleChange('height', ($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </div>
</template>
