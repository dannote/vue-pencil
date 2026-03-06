<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rects: { id: string; x: number; y: number; width: number; height: number }[]
  zoom: number
  editingId?: string | null
}>()

const HANDLE_SIZE = 8

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const handles: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function handlePos(rect: { x: number; y: number; width: number; height: number }, h: Handle) {
  let x = rect.x
  let y = rect.y
  if (h.includes('e')) x = rect.x + rect.width
  else if (!h.includes('w')) x = rect.x + rect.width / 2
  if (h.includes('s')) y = rect.y + rect.height
  else if (!h.includes('n')) y = rect.y + rect.height / 2
  return { x, y }
}

const cursors: Record<Handle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
}

const borderWidth = computed(() => 1.5 / props.zoom)
const handleSize = computed(() => HANDLE_SIZE / props.zoom)
const handleBorder = computed(() => 1 / props.zoom)
</script>

<template>
  <div class="pointer-events-none" style="position: absolute; inset: 0">
    <template v-for="rect in rects" :key="rect.id">
      <div
        :style="{
          position: 'absolute',
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: `${borderWidth}px solid #4361ee`,
        }"
      />
      <div
        v-for="h in handles"
        v-show="rect.id !== editingId"
        :key="`${rect.id}-${h}`"
        :style="{
          position: 'absolute',
          left: `${handlePos(rect, h).x - handleSize / 2}px`,
          top: `${handlePos(rect, h).y - handleSize / 2}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          background: 'white',
          border: `${handleBorder}px solid #4361ee`,
          borderRadius: `${handleBorder}px`,
          cursor: cursors[h],
        }"
      />
    </template>
  </div>
</template>
