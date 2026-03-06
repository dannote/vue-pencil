<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject, type Ref } from 'vue'
import { useDocumentStore } from '@/model/document'
import Island from './Island.vue'
import SelectionOverlay from './SelectionOverlay.vue'
import { getNodeRect, nodeRectToCanvas } from '@/renderer/geometry'

const store = useDocumentStore()
const preview = inject<Ref<boolean>>('preview')!

const panviewRef = ref<HTMLPanviewElement>()
const zoom = ref(1)
const islandRefs = ref<Record<string, InstanceType<typeof Island>>>({})

defineExpose({ panviewRef, zoom })

function onViewportChange() {
  if (panviewRef.value) zoom.value = panviewRef.value.zoom
}

// --- Selection rects ---

const selectionRects = computed(() => {
  if (preview.value) return []
  const rects: { id: string; x: number; y: number; width: number; height: number }[] = []

  for (const id of store.selectedIds) {
    const frameLayout = store.frameLayout[id]
    if (frameLayout) {
      rects.push({ id, ...frameLayout })
      continue
    }

    const frame = store.findFrameContaining(id)
    if (!frame) continue
    const layout = store.frameLayout[frame.id]
    if (!layout) continue

    const islandComp = islandRefs.value[frame.id]
    if (!islandComp?.iframe) continue

    const localRect = getNodeRect(islandComp.iframe, id)
    if (!localRect) continue

    const canvasRect = nodeRectToCanvas(localRect, layout)
    rects.push({ id, ...canvasRect })
  }

  return rects
})

// --- Hit testing ---

function hitTestFrames(canvasX: number, canvasY: number): { frameId: string; nodeId: string } | null {
  for (let i = store.frames.length - 1; i >= 0; i--) {
    const frame = store.frames[i]
    const layout = store.frameLayout[frame.id]
    if (!layout) continue

    if (
      canvasX >= layout.x &&
      canvasX <= layout.x + layout.width &&
      canvasY >= layout.y &&
      canvasY <= layout.y + layout.height
    ) {
      const islandComp = islandRefs.value[frame.id]
      if (!islandComp?.iframe?.contentDocument) return { frameId: frame.id, nodeId: frame.id }

      const localX = canvasX - layout.x
      const localY = canvasY - layout.y

      const el = islandComp.iframe.contentDocument.elementFromPoint(localX, localY)
      if (el) {
        const nodeId = el.closest('[data-node-id]')?.getAttribute('data-node-id')
        if (nodeId) return { frameId: frame.id, nodeId }
      }

      return { frameId: frame.id, nodeId: frame.id }
    }
  }
  return null
}

// --- Resize handle hit testing ---

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLE_SIZE = 8
const MIN_SIZE = 20

function hitTestHandle(canvasX: number, canvasY: number): { id: string; handle: Handle } | null {
  const hs = HANDLE_SIZE / zoom.value / 2

  for (const rect of selectionRects.value) {
    const corners: [Handle, number, number][] = [
      ['nw', rect.x, rect.y],
      ['ne', rect.x + rect.width, rect.y],
      ['sw', rect.x, rect.y + rect.height],
      ['se', rect.x + rect.width, rect.y + rect.height],
    ]
    for (const [handle, hx, hy] of corners) {
      if (Math.abs(canvasX - hx) <= hs && Math.abs(canvasY - hy) <= hs) {
        return { id: rect.id, handle }
      }
    }

    const edges: [Handle, boolean][] = [
      ['n', canvasY >= rect.y - hs && canvasY <= rect.y + hs && canvasX > rect.x + hs && canvasX < rect.x + rect.width - hs],
      ['s', canvasY >= rect.y + rect.height - hs && canvasY <= rect.y + rect.height + hs && canvasX > rect.x + hs && canvasX < rect.x + rect.width - hs],
      ['w', canvasX >= rect.x - hs && canvasX <= rect.x + hs && canvasY > rect.y + hs && canvasY < rect.y + rect.height - hs],
      ['e', canvasX >= rect.x + rect.width - hs && canvasX <= rect.x + rect.width + hs && canvasY > rect.y + hs && canvasY < rect.y + rect.height - hs],
    ]
    for (const [handle, hit] of edges) {
      if (hit) return { id: rect.id, handle }
    }
  }
  return null
}

// --- Pointer interaction ---

const CURSORS: Record<Handle, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
}

let mode: 'none' | 'drag-frame' | 'resize' = 'none'
let dragId = ''
let activeHandle: Handle | null = null
let dragStartCanvas = { x: 0, y: 0 }
let startRect = { x: 0, y: 0, w: 0, h: 0 }

function onPointerDown(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv || pv.spaceHeld || e.button === 1 || preview.value) return

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)

  // Check resize handles first
  const handleHit = hitTestHandle(canvas.x, canvas.y)
  if (handleHit) {
    mode = 'resize'
    dragId = handleHit.id
    activeHandle = handleHit.handle
    dragStartCanvas = { x: canvas.x, y: canvas.y }

    const layout = store.frameLayout[handleHit.id]
    if (layout) {
      startRect = { x: layout.x, y: layout.y, w: layout.width, h: layout.height }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    e.preventDefault()
    e.stopPropagation()
    return
  }

  // Hit test islands
  const hit = hitTestFrames(canvas.x, canvas.y)

  if (!hit) {
    store.deselect()
    return
  }

  store.select(hit.nodeId, e.shiftKey)

  if (hit.nodeId === hit.frameId) {
    mode = 'drag-frame'
    dragId = hit.frameId
    dragStartCanvas = { x: canvas.x, y: canvas.y }
    const layout = store.frameLayout[hit.frameId]
    startRect = { x: layout.x, y: layout.y, w: layout.width, h: layout.height }
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv) return

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)
  const dx = canvas.x - dragStartCanvas.x
  const dy = canvas.y - dragStartCanvas.y

  if (mode === 'drag-frame') {
    store.updateFramePos(dragId, startRect.x + dx, startRect.y + dy)
  }

  if (mode === 'resize' && activeHandle) {
    let { x, y, w, h } = startRect

    if (activeHandle.includes('w')) { x = startRect.x + dx; w = startRect.w - dx }
    if (activeHandle.includes('e')) { w = startRect.w + dx }
    if (activeHandle.includes('n')) { y = startRect.y + dy; h = startRect.h - dy }
    if (activeHandle.includes('s')) { h = startRect.h + dy }

    if (w < MIN_SIZE) {
      if (activeHandle.includes('w')) x = startRect.x + startRect.w - MIN_SIZE
      w = MIN_SIZE
    }
    if (h < MIN_SIZE) {
      if (activeHandle.includes('n')) y = startRect.y + startRect.h - MIN_SIZE
      h = MIN_SIZE
    }

    store.updateFramePos(dragId, x, y)
    store.updateFrameSize(dragId, w, h)
  }
}

function onPointerUp() {
  mode = 'none'
  activeHandle = null
  if (panviewRef.value) panviewRef.value.style.cursor = ''
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

// Hover cursor for resize handles
function onCanvasPointerMove(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv || preview.value || mode !== 'none') return

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)
  const handleHit = hitTestHandle(canvas.x, canvas.y)
  pv.style.cursor = handleHit ? CURSORS[handleHit.handle] : ''
}

function setIslandRef(frameId: string, comp: InstanceType<typeof Island> | null) {
  if (comp) {
    islandRefs.value[frameId] = comp
  } else {
    delete islandRefs.value[frameId]
  }
}

onMounted(() => {
  panviewRef.value?.addEventListener('pointerdown', onPointerDown)
  panviewRef.value?.addEventListener('pointermove', onCanvasPointerMove)
})

onBeforeUnmount(() => {
  panviewRef.value?.removeEventListener('pointerdown', onPointerDown)
  panviewRef.value?.removeEventListener('pointermove', onCanvasPointerMove)
})
</script>

<template>
  <design-panview
    ref="panviewRef"
    class="fixed top-10 left-60 right-60 bottom-0"
    style="background: #181825"
    @viewportchange="onViewportChange"
  >
    <Island
      v-for="frame in store.frames"
      :key="frame.id"
      :ref="(comp: any) => setIslandRef(frame.id, comp)"
      :frame="frame"
      :layout="store.frameLayout[frame.id]"
      :interactive="preview"
    />
    <SelectionOverlay v-if="!preview" :rects="selectionRects" :zoom="zoom" />
  </design-panview>
</template>
