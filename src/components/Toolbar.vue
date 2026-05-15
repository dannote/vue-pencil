<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'

import IconChevronDown from '~icons/lucide/chevron-down'
import IconCircle from '~icons/lucide/circle'
import IconFrame from '~icons/lucide/frame'
import IconMousePointer2 from '~icons/lucide/mouse-pointer-2'
import IconPlay from '~icons/lucide/play'
import IconSquare from '~icons/lucide/square'
import IconTextCursorInput from '~icons/lucide/text-cursor-input'
import IconType from '~icons/lucide/type'
import IconX from '~icons/lucide/x'

const props = defineProps<{
  zoom: number
  activeTool: string
  preview: boolean
}>()

const emit = defineEmits<{
  tool: [name: string]
  'update:preview': [value: boolean]
}>()

const tools = [
  { key: 'V', name: 'select', label: 'Move', icon: IconMousePointer2 },
  { key: 'F', name: 'frame', label: 'Frame', icon: IconFrame },
  { key: 'R', name: 'rectangle', label: 'Rectangle', icon: IconSquare },
  { key: 'O', name: 'ellipse', label: 'Ellipse', icon: IconCircle },
  { key: 'T', name: 'text', label: 'Text', icon: IconType },
  { key: 'I', name: 'input', label: 'Input', icon: IconTextCursorInput },
] as const

const shapeTools = tools.filter(tool => tool.name === 'rectangle' || tool.name === 'ellipse')
const primaryTools = tools.filter(tool => tool.name === 'select' || tool.name === 'frame' || tool.name === 'text' || tool.name === 'input')

const TOOL_BY_KEY: Record<string, string> = Object.fromEntries(
  tools.map(t => [t.key, t.name])
)

const activeLabel = computed(() => tools.find(tool => tool.name === props.activeTool)?.label ?? 'Move')
const activeShapeTool = computed(() => shapeTools.find(tool => tool.name === props.activeTool) ?? shapeTools[0])
const shapeActive = computed(() => shapeTools.some(tool => tool.name === props.activeTool))

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

function selectTool(name: string) {
  emit('tool', name)
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="fixed top-0 left-0 right-0 z-50 flex h-10 items-center justify-between border-b border-[#313244] bg-[#1e1e2e]/95 px-3 backdrop-blur">
    <div class="flex min-w-40 items-center gap-2">
      <span v-if="preview" class="rounded-md bg-[#313244] px-2 py-1 text-xs font-medium text-[#cdd6f4]">Preview Mode</span>
      <span v-else class="text-xs font-medium text-[#a6adc8]">{{ activeLabel }}</span>
    </div>

    <span class="text-[13px] font-semibold tracking-wide text-[#a6adc8]">VuePencil</span>

    <div class="flex min-w-40 items-center justify-end gap-3">
      <button
        class="flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors"
        :class="preview
          ? 'bg-[#a6e3a1] text-[#1e1e2e]'
          : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a] hover:text-[#cdd6f4]'"
        @click="emit('update:preview', !preview)"
      >
        <IconX v-if="preview" class="size-3.5" />
        <IconPlay v-else class="size-3.5" />
        {{ preview ? 'Exit Preview' : 'Preview' }}
      </button>
      <span class="min-w-[44px] text-center text-[11px] tabular-nums text-[#a6adc8]">{{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>

  <div v-if="!preview" class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
    <div class="flex items-center gap-0.5 rounded-xl border border-[#45475a] bg-[#1e1e2e]/95 p-1 shadow-2xl shadow-black/30 backdrop-blur">
      <button
        v-for="t in primaryTools.slice(0, 2)"
        :key="t.name"
        class="group relative flex size-8 cursor-pointer items-center justify-center rounded-lg border-none transition-colors"
        :class="activeTool === t.name
          ? 'bg-[#4361ee] text-white'
          : 'bg-transparent text-[#a6adc8] hover:bg-[#313244] hover:text-[#f5f5f5]'"
        :aria-label="t.label"
        :title="`${t.label} (${t.key})`"
        @click="selectTool(t.name)"
      >
        <component :is="t.icon" class="size-4" />
        <span class="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#45475a] bg-[#181825] px-2 py-1 text-[11px] font-medium text-[#cdd6f4] shadow-lg group-hover:block">
          {{ t.label }} <span class="text-[#6c7086]">{{ t.key }}</span>
        </span>
      </button>

      <div class="flex items-center">
        <button
          class="group relative flex size-8 cursor-pointer items-center justify-center rounded-lg border-none transition-colors"
          :class="shapeActive
            ? 'bg-[#4361ee] text-white'
            : 'bg-transparent text-[#a6adc8] hover:bg-[#313244] hover:text-[#f5f5f5]'"
          :title="`${activeShapeTool.label} (${activeShapeTool.key})`"
          @click="selectTool(activeShapeTool.name)"
        >
          <component :is="activeShapeTool.icon" class="size-4" />
          <span class="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#45475a] bg-[#181825] px-2 py-1 text-[11px] font-medium text-[#cdd6f4] shadow-lg group-hover:block">
            Shape <span class="text-[#6c7086]">R/O</span>
          </span>
        </button>

        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              class="flex h-8 w-3 cursor-pointer items-center justify-center rounded-lg border-none transition-colors"
              :class="shapeActive
                ? 'bg-[#4361ee] text-white'
                : 'bg-transparent text-[#a6adc8] hover:bg-[#313244] hover:text-[#f5f5f5]'"
              aria-label="Shape tools"
            >
              <IconChevronDown class="size-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              side="top"
              :side-offset="8"
              align="start"
              class="z-[60] min-w-36 rounded-xl border border-[#45475a] bg-[#1e1e2e] p-1 text-[#cdd6f4] shadow-2xl shadow-black/30"
            >
              <DropdownMenuItem
                v-for="tool in shapeTools"
                :key="tool.name"
                class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium outline-none hover:bg-[#313244] data-[highlighted]:bg-[#313244]"
                :class="activeTool === tool.name ? 'bg-[#4361ee] text-white' : ''"
                @select="selectTool(tool.name)"
              >
                <component :is="tool.icon" class="size-3.5" />
                <span class="flex-1">{{ tool.label }}</span>
                <span class="text-[11px] text-[#6c7086]">{{ tool.key }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>

      <button
        v-for="t in primaryTools.slice(2)"
        :key="t.name"
        class="group relative flex size-8 cursor-pointer items-center justify-center rounded-lg border-none transition-colors"
        :class="activeTool === t.name
          ? 'bg-[#4361ee] text-white'
          : 'bg-transparent text-[#a6adc8] hover:bg-[#313244] hover:text-[#f5f5f5]'"
        :aria-label="t.label"
        :title="`${t.label} (${t.key})`"
        @click="selectTool(t.name)"
      >
        <component :is="t.icon" class="size-4" />
        <span class="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#45475a] bg-[#181825] px-2 py-1 text-[11px] font-medium text-[#cdd6f4] shadow-lg group-hover:block">
          {{ t.label }} <span class="text-[#6c7086]">{{ t.key }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
