<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDocumentStore } from '@/model/document'
import Island from './Island.vue'
import SelectionOverlay from './SelectionOverlay.vue'
import { getNodeRect, nodeRectToCanvas } from '@/renderer/geometry'

const store = useDocumentStore()

const panviewRef = ref<HTMLPanviewElement>()
const zoom = ref(1)
const islandRefs = ref<Record<string, InstanceType<typeof Island>>>({})

defineExpose({ panviewRef, zoom })

function onViewportChange() {
  if (panviewRef.value) zoom.value = panviewRef.value.zoom
}

const selectionRects = computed(() => {
  const rects: { id: string; x: number; y: number; width: number; height: number }[] = []

  for (const id of store.selectedIds) {
    // Is it a frame?
    const frameLayout = store.frameLayout[id]
    if (frameLayout) {
      rects.push({ id, ...frameLayout })
      continue
    }

    // Find which frame contains this node
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

// Hit testing
function hitTestFrames(canvasX: number, canvasY: number): { frameId: string; nodeId: string } | null {
  // Reverse order: last drawn = on top
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
      // Hit inside this frame — find the deepest element
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

// Pointer interaction
let mode: 'none' | 'drag-frame' | 'drag-element' = 'none'
let dragFrameId = ''
let dragStartCanvas = { x: 0, y: 0 }
let dragStartLayout = { x: 0, y: 0 }

function onPointerDown(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv || pv.spaceHeld || e.button === 1) return

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)
  const hit = hitTestFrames(canvas.x, canvas.y)

  if (!hit) {
    store.deselect()
    return
  }

  store.select(hit.nodeId, e.shiftKey)

  // Start drag
  if (hit.nodeId === hit.frameId) {
    // Dragging a frame
    mode = 'drag-frame'
    dragFrameId = hit.frameId
    dragStartCanvas = { x: canvas.x, y: canvas.y }
    const layout = store.frameLayout[hit.frameId]
    dragStartLayout = { x: layout.x, y: layout.y }
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
    store.updateFramePos(dragFrameId, dragStartLayout.x + dx, dragStartLayout.y + dy)
  }
}

function onPointerUp() {
  mode = 'none'
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
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
})

onBeforeUnmount(() => {
  panviewRef.value?.removeEventListener('pointerdown', onPointerDown)
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
    />
    <SelectionOverlay :rects="selectionRects" :zoom="zoom" />
  </design-panview>
</template>
