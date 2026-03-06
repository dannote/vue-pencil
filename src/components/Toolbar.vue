<script setup lang="ts">
defineProps<{
  zoom: number
  activeTool: string
  preview: boolean
}>()

const emit = defineEmits<{
  tool: [name: string]
  'update:preview': [value: boolean]
}>()

const tools = [
  { key: 'V', name: 'select', label: 'Move' },
  { key: 'F', name: 'frame', label: 'Frame' },
  { key: 'R', name: 'rectangle', label: 'Rectangle' },
  { key: 'T', name: 'text', label: 'Text' },
  { key: 'O', name: 'ellipse', label: 'Ellipse' },
] as const
</script>

<template>
  <div class="fixed top-0 left-0 right-0 h-10 bg-[#1e1e2e] border-b border-[#313244] flex items-center justify-between px-3 z-50">
    <div class="flex items-center gap-1">
      <template v-if="!preview">
        <button
          v-for="t in tools"
          :key="t.name"
          class="w-8 h-8 flex items-center justify-center rounded-md text-xs font-semibold transition-colors"
          :class="activeTool === t.name
            ? 'bg-[#4361ee] text-white'
            : 'text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]'"
          :title="t.label"
          @click="emit('tool', t.name)"
        >
          {{ t.key }}
        </button>
      </template>
      <span v-else class="text-[#a6adc8] text-xs font-medium px-2">Preview Mode</span>
    </div>
    <span class="text-[13px] font-semibold text-[#a6adc8] tracking-wide">OpenPencil</span>
    <div class="flex items-center gap-3">
      <button
        class="h-7 px-3 rounded-md text-xs font-semibold transition-colors"
        :class="preview
          ? 'bg-[#a6e3a1] text-[#1e1e2e]'
          : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'"
        @click="emit('update:preview', !preview)"
      >
        {{ preview ? '✕ Exit Preview' : '▶ Preview' }}
      </button>
      <span class="text-[#a6adc8] text-[11px] tabular-nums min-w-[44px] text-center">{{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>
</template>
