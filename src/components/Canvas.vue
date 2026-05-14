<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, inject, nextTick, type Ref } from 'vue'
import { useDocumentStore } from '@/model/document'
import { findNode, findParent, removeNode, insertChild, cloneNode } from '@/model/operations'
import { ISLAND_BLEED } from '@/renderer/island-renderer'
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
const activeTool = inject<Ref<string>>('activeTool')!

const panviewRef = ref<HTMLPanviewElement>()
const zoom = ref(1)
const islandRefs = ref<Record<string, InstanceType<typeof Island>>>({})

defineExpose({ panviewRef, zoom })

function onViewportChange() {
  if (panviewRef.value) zoom.value = panviewRef.value.zoom
}

function onLibraryDrop(event: DragEvent) {
  const pv = panviewRef.value
  if (!pv) return

  const componentId = event.dataTransfer?.getData('application/x-vue-pencil-library-component')
    || event.dataTransfer?.getData('text/plain')
  if (!componentId) return

  event.preventDefault()
  const canvas = pv.viewportToCanvas(event.clientX, event.clientY)
  const hit = hitTestFrames(canvas.x, canvas.y)
  store.insertLibraryComponentAt(componentId, canvas.x, canvas.y, hit?.nodeId)
  refreshGeometry()
}

// --- Selection rects ---

const geometryVersion = ref(0)

function refreshGeometry() {
  nextTick(() => {
    requestAnimationFrame(() => {
      geometryVersion.value++
    })
  })
}

const selectionRects = computed(() => {
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

      const el = islandComp.iframe.contentDocument.elementFromPoint(localX + ISLAND_BLEED, localY + ISLAND_BLEED)
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

    let current: Element | null = islandComp.iframe.contentDocument.elementFromPoint(localX + ISLAND_BLEED, localY + ISLAND_BLEED)?.closest('[data-node-id]') ?? null
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

        let adjustedIndex = idx
        const draggedParent = modelNode.children.findIndex(
          (c) => typeof c !== 'string' && c.id === draggedNodeId,
        )
        if (draggedParent !== -1 && draggedParent < idx) {
          adjustedIndex = idx
        }

        return { frameId: frame.id, parentId: nid, index: adjustedIndex, line: lineCanvas }
      }

      current = current.parentElement?.closest('[data-node-id]') ?? null
    }

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

// --- Drawing tools ---

const drawPreview = ref<{ x: number; y: number; width: number; height: number } | null>(null)

const DRAW_TOOLS = new Set(['frame', 'rectangle', 'text', 'ellipse', 'input'])

function isDrawTool(): boolean {
  return DRAW_TOOLS.has(activeTool.value)
}

interface DrawState {
  startX: number
  startY: number
  tool: string
}

let drawState: DrawState | null = null

function createNodeFromTool(tool: string, x: number, y: number, w: number, h: number) {
  switch (tool) {
    case 'frame': {
      const frame = store.addFrame(x, y, Math.max(w, MIN_SIZE), Math.max(h, MIN_SIZE), {
        background: 'white',
        borderRadius: '8px',
      })
      store.select(frame.id)
      break
    }
    case 'rectangle': {
      const frame = store.addFrame(x, y, Math.max(w, MIN_SIZE), Math.max(h, MIN_SIZE), {
        background: '#d9d9d9',
      })
      store.select(frame.id)
      break
    }
    case 'ellipse': {
      const frame = store.addFrame(x, y, Math.max(w, MIN_SIZE), Math.max(h, MIN_SIZE), {
        background: '#d9d9d9',
        borderRadius: '50%',
      })
      store.select(frame.id)
      break
    }
    case 'text': {
      const minW = Math.max(w, 120)
      const minH = Math.max(h, 40)
      const frame = store.addFrame(x, y, minW, minH, {
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '16px',
        color: '#1e1e2e',
      })
      store.addChild(frame.id, 'p', {
        margin: '0',
      }, ['Type something'], undefined, undefined, true)
      store.select(frame.id)
      break
    }
    case 'input': {
      const minW = Math.max(w, 200)
      const minH = Math.max(h, 60)
      const frame = store.addFrame(x, y, minW, minH, {
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      })
      const input = store.addChild(frame.id, 'input', {
        width: '100%',
        padding: '8px 12px',
        border: '2px solid #cdd6f4',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
      }, [], undefined, 'Text Input', true)
      if (input) {
        input.props.type = 'text'
        input.props.placeholder = 'Enter text...'
      }
      store.select(frame.id)
      break
    }
  }

  activeTool.value = 'select'
  refreshGeometry()
}

// --- Pointer interaction ---

const CURSORS: Record<Handle, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
}

const TEXT_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'a', 'li', 'dt', 'dd', 'figcaption', 'blockquote', 'em', 'strong', 'b', 'i', 'u', 'small', 'sub', 'sup'])

let mode: 'none' | 'pending-drag' | 'drag-frame' | 'drag-element' | 'resize' | 'drawing' = 'none'
let dragId = ''
let dragHitFrameId = ''
let activeHandle: Handle | null = null
let dragStartCanvas = { x: 0, y: 0 }
let lastDragCanvas = { x: 0, y: 0 }
let startRect = { x: 0, y: 0, w: 0, h: 0 }
let lastClickTime = 0
let lastClickNodeId = ''
let altClone = false

const dropTarget = reactive<{ value: DropTarget | null }>({ value: null })

const insertionLine = computed(() => dropTarget.value?.line ?? null)

const DBLCLICK_MS = 400

function onPointerDown(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv || pv.spaceHeld || e.button === 1 || preview.value) return

  // Commit text editing on click outside
  if (store.editingTextId) {
    const canvas = pv.viewportToCanvas(e.clientX, e.clientY)
    const hit = hitTestFrames(canvas.x, canvas.y)
    if (!hit || hit.nodeId !== store.editingTextId) {
      store.commitTextEdit()
      refreshGeometry()
    }
    return
  }

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)

  // Drawing tools
  if (isDrawTool()) {
    mode = 'drawing'
    drawState = { startX: canvas.x, startY: canvas.y, tool: activeTool.value }
    drawPreview.value = { x: canvas.x, y: canvas.y, width: 0, height: 0 }
    store.deselect()
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    e.preventDefault()
    return
  }

  // Resize handles
  const handleHit = hitTestHandle(canvas.x, canvas.y)
  if (handleHit) {
    store.recordHistory()
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

  // Double-click on text
  const now = performance.now()
  if (
    now - lastClickTime < DBLCLICK_MS &&
    lastClickNodeId === hit.nodeId &&
    hit.nodeId !== hit.frameId
  ) {
    const frame = store.findFrameContaining(hit.nodeId)
    if (frame) {
      const node = findNode(frame, hit.nodeId)
      if (node && TEXT_TAGS.has(node.type)) {
        store.select(hit.nodeId)
        store.startTextEditing(hit.nodeId)
        lastClickTime = 0
        lastClickNodeId = ''
        e.preventDefault()
        return
      }
    }
  }
  lastClickTime = now
  lastClickNodeId = hit.nodeId

  store.select(hit.nodeId, e.shiftKey)
  dragStartCanvas = { x: canvas.x, y: canvas.y }
  dragId = hit.nodeId
  dragHitFrameId = hit.frameId
  altClone = e.altKey

  if (hit.nodeId === hit.frameId) {
    store.recordHistory()
    mode = 'drag-frame'
    const layout = store.frameLayout[hit.frameId]
    startRect = { x: layout.x, y: layout.y, w: layout.width, h: layout.height }

    if (altClone) {
      const frame = store.frames.find(f => f.id === hit.frameId)
      if (frame) {
        const clone = cloneNode(frame)
        store.frames.push(clone)
        store.frameLayout[clone.id] = { ...layout }
        dragId = clone.id
        store.select(clone.id)
      }
    }
  } else {
    store.recordHistory()
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
  lastDragCanvas = { x: canvas.x, y: canvas.y }

  if (mode === 'drawing' && drawState) {
    const x = Math.min(drawState.startX, canvas.x)
    const y = Math.min(drawState.startY, canvas.y)
    const w = Math.abs(canvas.x - drawState.startX)
    const h = Math.abs(canvas.y - drawState.startY)
    drawPreview.value = { x, y, width: w, height: h }
    return
  }

  const dx = canvas.x - dragStartCanvas.x
  const dy = canvas.y - dragStartCanvas.y

  if (mode === 'pending-drag') {
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      mode = 'drag-element'
      pv.style.cursor = 'grabbing'

      if (altClone) {
        const frame = store.findFrameContaining(dragId)
        if (frame) {
          const node = findNode(frame, dragId)
          if (node) {
            const clone = cloneNode(node)
            const loc = findParent(frame, dragId)
            if (loc) {
              insertChild(loc.parent, clone, loc.index + 1)
              dragId = clone.id
              store.select(clone.id)
            }
          }
        }
      }
    } else {
      return
    }
  }

  if (mode === 'drag-frame') {
    store.updateFramePos(dragId, startRect.x + dx, startRect.y + dy, true)
    const target = findDropTarget(canvas.x, canvas.y, dragId)
    dropTarget.value = target?.frameId === dragId ? null : target
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

    store.updateFramePos(dragId, x, y, true)
    store.updateFrameSize(dragId, w, h, true)
  }
}

function onPointerUp(e?: PointerEvent) {
  if (mode === 'drawing' && drawState && drawPreview.value) {
    const { x, y, width, height } = drawPreview.value
    createNodeFromTool(drawState.tool, x, y, width, height)
    drawState = null
    drawPreview.value = null
    mode = 'none'
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    return
  }

  if (mode === 'drag-frame' && dropTarget.value) {
    store.moveFrameInto(dragId, dropTarget.value.parentId, dropTarget.value.index)
    refreshGeometry()
  } else if (mode === 'drag-element' && dropTarget.value) {
    store.moveNodeTo(dragId, dropTarget.value.parentId, dropTarget.value.index)
    store.select(dragId)
    refreshGeometry()
  } else if (mode === 'drag-element' && e) {
    const pv = panviewRef.value
    const canvas = pv ? pv.viewportToCanvas(e.clientX, e.clientY) : lastDragCanvas
    const sourceLayout = store.frameLayout[dragHitFrameId]
    const outsideSource = sourceLayout && (
      canvas.x < sourceLayout.x ||
      canvas.x > sourceLayout.x + sourceLayout.width ||
      canvas.y < sourceLayout.y ||
      canvas.y > sourceLayout.y + sourceLayout.height
    )

    if (outsideSource) {
      store.extractNodeToFrame(dragId, canvas.x, canvas.y)
      refreshGeometry()
    }
  }

  mode = 'none'
  activeHandle = null
  drawState = null
  drawPreview.value = null
  dropTarget.value = null
  altClone = false
  if (panviewRef.value) panviewRef.value.style.cursor = ''
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

// Hover cursor
function onCanvasPointerMove(e: PointerEvent) {
  const pv = panviewRef.value
  if (!pv || preview.value || mode !== 'none') return

  if (isDrawTool()) {
    pv.style.cursor = 'crosshair'
    return
  }

  const canvas = pv.viewportToCanvas(e.clientX, e.clientY)
  const handleHit = hitTestHandle(canvas.x, canvas.y)
  pv.style.cursor = handleHit ? CURSORS[handleHit.handle] : ''
}

function onCommitText(nodeId: string, text: string) {
  store.updateNodeText(nodeId, [text])
  store.commitTextEdit()
  refreshGeometry()
}

function setIslandRef(frameId: string, comp: InstanceType<typeof Island> | null) {
  if (comp) {
    islandRefs.value[frameId] = comp
  } else {
    delete islandRefs.value[frameId]
  }
}

function toggleAutoLayout() {
  if (store.selectedIds.size !== 1) return
  const id = [...store.selectedIds][0]

  for (const frame of store.frames) {
    const node = findNode(frame, id)
    if (!node) continue

    if (node.props.style?.display === 'flex' || node.props.style?.display === 'inline-flex') {
      store.updateNodeStyle(id, { display: '', flexDirection: '', gap: '', padding: '', alignItems: '', justifyContent: '' })
    } else {
      // Detect direction: if children are laid out more horizontally, use row
      const frameLayout = store.frameLayout[id]
      const islandComp = islandRefs.value[frame.id]
      let direction: 'row' | 'column' = 'column'

      const iframeEl = frameLayout ? islandComp?.iframe : islandRefs.value[frame.id]?.iframe
      if (iframeEl && node.children.filter(c => typeof c !== 'string').length >= 2) {
        const rects = getChildRects(iframeEl, id)
        if (rects.length >= 2) {
          const dx = Math.abs(rects[1].rect.x - rects[0].rect.x)
          const dy = Math.abs(rects[1].rect.y - rects[0].rect.y)
          if (dx > dy) direction = 'row'
        }
      }

      store.updateNodeStyle(id, {
        display: 'flex',
        flexDirection: direction,
        gap: '8px',
        padding: node.props.style?.padding || '8px',
      })
    }
    refreshGeometry()
    return
  }
}

function onKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
    refreshGeometry()
    return
  }

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    store.redo()
    refreshGeometry()
    return
  }

  if (store.editingTextId) {
    if (e.key === 'Escape') {
      store.commitTextEdit()
      refreshGeometry()
    }
    return
  }

  if (e.key === 'Escape') {
    if (isDrawTool()) activeTool.value = 'select'
  }

  if (e.key === 'a' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    toggleAutoLayout()
    return
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedIds.size > 0) {
    store.recordHistory()
    for (const id of store.selectedIds) {
      if (store.frameLayout[id]) {
        store.removeFrame(id, true)
      } else {
        for (const frame of store.frames) {
          removeNode(frame, id)
        }
      }
    }
    store.deselect()
    refreshGeometry()
  }
}

onMounted(() => {
  panviewRef.value?.addEventListener('pointerdown', onPointerDown)
  panviewRef.value?.addEventListener('pointermove', onCanvasPointerMove)
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  panviewRef.value?.removeEventListener('pointerdown', onPointerDown)
  panviewRef.value?.removeEventListener('pointermove', onCanvasPointerMove)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <design-panview
    ref="panviewRef"
    class="fixed top-10 left-60 right-72 bottom-0"
    style="background: #181825"
    @viewportchange="onViewportChange"
    @dragover.prevent
    @drop="onLibraryDrop"
  >
    <Island
      v-for="frame in store.frames"
      :key="frame.id"
      :ref="(comp: any) => setIslandRef(frame.id, comp)"
      :frame="frame"
      :layout="store.frameLayout[frame.id]"
      :interactive="preview"
      :editing-text-id="store.editingTextId"
      :capabilities="store.capabilities"
      :bindings="store.bindings"
      @commit-text="onCommitText"
    />
    <SelectionOverlay v-if="!preview" :rects="selectionRects" :zoom="zoom" :editing-id="store.editingTextId" />
    <InsertionIndicator :line="insertionLine" :zoom="zoom" />

    <!-- Draw preview rectangle -->
    <div
      v-if="drawPreview"
      :style="{
        position: 'absolute',
        left: `${drawPreview.x}px`,
        top: `${drawPreview.y}px`,
        width: `${drawPreview.width}px`,
        height: `${drawPreview.height}px`,
        border: '2px solid #4361ee',
        borderRadius: activeTool === 'ellipse' ? '50%' : '0',
        background: 'rgba(67, 97, 238, 0.08)',
        pointerEvents: 'none',
      }"
    />
  </design-panview>
</template>
