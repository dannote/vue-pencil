<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Binding, CapabilityInstance, DesignNode, FrameLayout } from '@/model/types'
import { mountIsland, type IslandApp } from '@/renderer/island-renderer'

const props = defineProps<{
  frame: DesignNode
  layout: FrameLayout
  interactive: boolean
  editingTextId: string | null
  capabilities: CapabilityInstance[]
  bindings: Binding[]
}>()

const emit = defineEmits<{
  commitText: [nodeId: string, text: string]
}>()

const BLEED = 40

const iframeRef = ref<HTMLIFrameElement>()
let islandApp: IslandApp | null = null
let editingEl: HTMLElement | null = null

function getEditingElement(nodeId: string): HTMLElement | null {
  const doc = iframeRef.value?.contentDocument
  if (!doc) return null
  return doc.querySelector(`[data-node-id="${nodeId}"]`)
}

function onEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    commitEditing()
  }
}

function commitEditing() {
  if (!editingEl) return
  const nodeId = editingEl.getAttribute('data-node-id')
  const text = editingEl.textContent ?? ''
  editingEl.removeAttribute('contenteditable')
  editingEl.removeEventListener('keydown', onEditKeydown)
  editingEl.removeEventListener('blur', commitEditing)
  editingEl = null
  if (nodeId) emit('commitText', nodeId, text)
}

function startEditing(nodeId: string) {
  if (editingEl) commitEditing()

  const el = getEditingElement(nodeId)
  if (!el) return

  editingEl = el
  el.setAttribute('contenteditable', 'true')
  el.style.outline = 'none'
  el.style.cursor = 'text'
  el.addEventListener('keydown', onEditKeydown)
  el.addEventListener('blur', commitEditing, { once: true })

  el.focus()

  // Select all text
  const doc = iframeRef.value?.contentDocument
  if (doc) {
    const range = doc.createRange()
    range.selectNodeContents(el)
    const sel = doc.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
}

watch(
  () => props.editingTextId,
  (id, prevId) => {
    if (prevId && editingEl) commitEditing()
    if (!id) return

    // Only act if this island contains the node
    const el = getEditingElement(id)
    if (!el) return

    nextTick(() => startEditing(id))
  },
)

onMounted(() => {
  const iframe = iframeRef.value
  if (!iframe) return

  iframe.addEventListener('load', () => {
    islandApp = mountIsland(iframe, props.frame, {
      capabilities: props.capabilities,
      bindings: props.bindings,
    })
  }, { once: true })
})

watch(
  () => props.frame,
  (newTree) => {
    if (islandApp) islandApp.tree.value = newTree
  },
  { deep: true },
)

watch(
  () => [props.capabilities, props.bindings] as const,
  ([capabilities, bindings]) => {
    if (islandApp) islandApp.runtime.value = { capabilities, bindings }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (editingEl) commitEditing()
  islandApp?.destroy()
  islandApp = null
})

defineExpose({
  get iframe() {
    return iframeRef.value
  },
})
</script>

<template>
  <div
    :style="{
      position: 'absolute',
      left: `${layout.x}px`,
      top: `${layout.y}px`,
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      overflow: 'visible',
    }"
    :data-frame-id="frame.id"
  >
    <iframe
      ref="iframeRef"
      srcdoc="<!DOCTYPE html><html><head></head><body></body></html>"
      :style="{
        border: 'none',
        width: `calc(100% + ${BLEED * 2}px)`,
        height: `calc(100% + ${BLEED * 2}px)`,
        margin: `-${BLEED}px`,
        display: 'block',
        background: 'transparent',
        pointerEvents: interactive ? 'auto' : 'none',
      }"
    />
    <!-- Shield: blocks pointer events in edit mode, removed in preview and during text editing -->
    <div
      v-if="!interactive && !editingTextId"
      style="position: absolute; inset: 0; z-index: 1"
    />
  </div>
</template>
