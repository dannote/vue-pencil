<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { DesignNode, FrameLayout } from '@/model/types'
import { mountIsland, type IslandApp } from '@/renderer/island-renderer'

const props = defineProps<{
  frame: DesignNode
  layout: FrameLayout
}>()

const iframeRef = ref<HTMLIFrameElement>()
let islandApp: IslandApp | null = null

onMounted(() => {
  const iframe = iframeRef.value
  if (!iframe) return

  iframe.addEventListener('load', () => {
    islandApp = mountIsland(iframe, props.frame)
  }, { once: true })
})

watch(
  () => props.frame,
  (newTree) => {
    if (islandApp) islandApp.tree.value = newTree
  },
  { deep: true },
)

onBeforeUnmount(() => {
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
    }"
    :data-frame-id="frame.id"
  >
    <iframe
      ref="iframeRef"
      srcdoc="<!DOCTYPE html><html><head></head><body></body></html>"
      :style="{
        border: 'none',
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'transparent',
      }"
    />
    <!-- Shield: blocks pointer events in edit mode -->
    <div style="position: absolute; inset: 0; z-index: 1" />
  </div>
</template>
