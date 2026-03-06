<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

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
  { key: 'I', name: 'input', label: 'Input' },
] as const

const TOOL_BY_KEY: Record<string, string> = Object.fromEntries(
  tools.map(t => [t.key, t.name])
)

function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
  if ((e.target as HTMLElement).isContentEditable) return
  if (e.metaKey || e.ctrlKey || e.altKey) return

  const tool = TOOL_BY_KEY[e.key.toUpperCase()]
  if (tool) {
    e.preventDefault()
    emit('tool', tool)
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed top-0 left-0 right-0 z-50 flex h-10 items-center justify-between border-b border-[#313244] bg-[#1e1e2e] px-3">
    <div class="flex items-center gap-1">
      <template v-if="!preview">
        <button
          v-for="t in tools"
          :key="t.name"
          class="flex size-8 items-center justify-center rounded-md text-xs font-semibold transition-colors"
          :class="activeTool === t.name
            ? 'bg-[#4361ee] text-white'
            : 'text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]'"
          :title="`${t.label} (${t.key})`"
          @click="emit('tool', t.name)"
        >
          {{ t.key }}
        </button>
      </template>
      <span v-else class="px-2 text-xs font-medium text-[#a6adc8]">Preview Mode</span>
    </div>
    <span class="text-[13px] font-semibold tracking-wide text-[#a6adc8]">VuePencil</span>
    <div class="flex items-center gap-3">
      <button
        class="h-7 rounded-md px-3 text-xs font-semibold transition-colors"
        :class="preview
          ? 'bg-[#a6e3a1] text-[#1e1e2e]'
          : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'"
        @click="emit('update:preview', !preview)"
      >
        {{ preview ? '✕ Exit Preview' : '▶ Preview' }}
      </button>
      <span class="min-w-[44px] text-center text-[11px] tabular-nums text-[#a6adc8]">{{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>
</template>
