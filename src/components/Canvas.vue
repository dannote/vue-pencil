<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, inject, nextTick, type Ref } from 'vue'
import { useDocumentStore } from '@/model/document'
import { findNode } from '@/model/operations'
import Island from './Island.vue'
import SelectionOverlay from './SelectionOverlay.vue'
import InsertionIndicator from './InsertionIndicator.vue'
import {
  getNodeRect,
  nodeRectToCanvas,
  getChildRects,
  computeInsertionIndex,
  getInsertionLinePosition,
  type NodeRect,
} from '@/renderer/geometry'
import { isFlexContainer, getFlexDirection } from '@/renderer/flex-detect'

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

// Bumped after operations that move elements, so the computed re-evaluates
const geometryVersion = ref(0)

function refreshGeometry() {
  nextTick(() => {
    requestAnimationFrame(() => {
      geometryVersion.value++
    })
  })
}

const selectionRects = computed(() => {
  // Track these so we re-evaluate when they change
  void geometryVersion.value
  if (preview.value) return []
  const rects: { id: string; x: number; y: number; width: number; height: number }[] = []

  for (const id of store.selectedIds) {
    const rect = getCanvasRect(id)
    if (rect) rects.push({ id, ...rect })
  }

  return rects
})

function getCanvasRect(nodeId: string): NodeRect | null {
  const frameLayout = store.frameLayout[nodeId]
  if (frameLayout) return frameLayout

  const frame = store.findFrameContaining(nodeId)
  if (!frame) return null
  const layout = store.frameLayout[frame.id]
  if (!layout) return null

  const islandComp = islandRefs.value[frame.id]
  if (!islandComp?.iframe) return null

  const localRect = getNodeRect(islandComp.iframe, nodeId)
  if (!localRect) return null

  return nodeRectToCanvas(localRect, layout)
}

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
        const nid = el.closest('[data-node-id]')?.getAttribute('data-node-id')
        if (nid) return { frameId: frame.id, nodeId: nid }
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
const DRAG_THRESHOLD = 3

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

// --- Find drop target (flex parent) under cursor ---

interface DropTarget {
  frameId: string
  parentId: string
  index: number
  line: NodeRect
}

function findDropTarget(canvasX: number, canvasY: number, draggedNodeId: string): DropTarget | null {
  for (let i = store.frames.length - 1; i >= 0; i--) {
    const frame = store.frames[i]
    const layout = store.frameLayout[frame.id]
    if (!layout) continue

    if (
      canvasX < layout.x || canvasX > layout.x + layout.width ||
      canvasY < layout.y || canvasY > layout.y + layout.height
    ) continue

    const localX = canvasX - layout.x
    const localY = canvasY - layout.y

    const islandComp = islandRefs.value[frame.id]
    if (!islandComp?.iframe?.contentDocument) continue

    // Walk up from deepest hit element to find the nearest flex container
    const el = islandComp.iframe.contentDocument.elementFromPoint(localX, localY)
    if (!el) continue

    let current: Element | null = el.closest('[data-node-id]')
    while (current) {
      const nid = current.getAttribute('data-node-id')
      if (!nid || nid === draggedNodeId) {
        current = current.parentElement?.closest('[data-node-id]') ?? null
        continue
      }

      const modelNode = findNode(frame, nid)
      if (modelNode && isFlexContainer(modelNode)) {
        const direction = getFlexDirection(modelNode)
        const childRects = getChildRects(islandComp.iframe!, nid)
          .filter((c) => c.nodeId !== draggedNodeId)

        const idx = computeInsertionIndex(childRects, { x: localX, y: localY }, direction)

        const parentRect = getNodeRect(islandComp.iframe!, nid)
        if (!parentRect) break

        const lineLocal = getInsertionLinePosition(childRects, idx, parentRect, direction)
        const lineCanvas = {
          x: layout.x + lineLocal.x,
          y: layout.y + lineLocal.y,
          width: lineLocal.width,
          height: lineLocal.height,
        }

        // Adjust index for the dragged node's original position
        let adjustedIndex = idx
        const draggedParent = modelNode.children.findIndex(
          (c) => typeof c !== 'string' && c.id === draggedNodeId,
        )
        if (draggedParent !== -1 && draggedParent < idx) {
          adjustedIndex = idx // After removal, indices shift down — but computeInsertionIndex already excludes dragged
        }

        return { frameId: frame.id, parentId: nid, index: adjustedIndex, line: lineCanvas }
      }

      current = current.parentElement?.closest('[data-node-id]') ?? null
    }

    // Frame root itself might be a flex container
    if (isFlexContainer(frame)) {
      const direction = getFlexDirection(frame)
      const childRects = getChildRects(islandComp.iframe!, frame.id)
        .filter((c) => c.nodeId !== draggedNodeId)

      const idx = computeInsertionIndex(childRects, { x: localX, y: localY }, direction)

      const parentRect = getNodeRect(islandComp.iframe!, frame.id)
      if (!parentRect) continue

      const lineLocal = getInsertionLinePosition(childRects, idx, parentRect, direction)
      const lineCanvas = {
        x: layout.x + lineLocal.x,
        y: layout.y + lineLocal.y,
        width: lineLocal.width,
        height: lineLocal.height,
      }

      return { frameId: frame.id, parentId: frame.id, index: idx, line: lineCanvas }
    }
  }
  return null
}

// --- Pointer interaction ---

const CURSORS: Record<Handle, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
}

let mode: 'none' | 'pending-drag' | 'drag-frame' | 'drag-element' | 'resize' = 'none'
let dragId = ''
let dragHitFrameId = ''
let activeHandle: Handle | null = null
let dragStartCanvas = { x: 0, y: 0 }
let startRect = { x: 0, y: 0, w: 0, h: 0 }

const dropTarget = reactive<{ value: DropTarget | null }>({ value: null })

const insertionLine = computed(() => dropTarget.value?.line ?? null)

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
  dragStartCanvas = { x: canvas.x, y: canvas.y }
  dragId = hit.nodeId
  dragHitFrameId = hit.frameId

  if (hit.nodeId === hit.frameId) {
    // Frame: start drag immediately (no threshold needed, frames are big)
    mode = 'drag-frame'
    const layout = store.frameLayout[hit.frameId]
    startRect = { x: layout.x, y: layout.y, w: layout.width, h: layout.height }
  } else {
    // Element inside a frame: wait for threshold before starting drag
    mode = 'pending-drag'
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

  if (mode === 'pending-drag') {
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      mode = 'drag-element'
      pv.style.cursor = 'grabbing'
    } else {
      return
    }
  }

  if (mode === 'drag-frame') {
    store.updateFramePos(dragId, startRect.x + dx, startRect.y + dy)
  }

  if (mode === 'drag-element') {
    const target = findDropTarget(canvas.x, canvas.y, dragId)
    dropTarget.value = target

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
  if (mode === 'drag-element' && dropTarget.value) {
    store.moveNodeTo(dragId, dropTarget.value.parentId, dropTarget.value.index)
    store.select(dragId)
    refreshGeometry()
  }

  mode = 'none'
  activeHandle = null
  dropTarget.value = null
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
    class="fixed top-10 left-60 right-72 bottom-0"
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
    <InsertionIndicator :line="insertionLine" :zoom="zoom" />
  </design-panview>
</template>
