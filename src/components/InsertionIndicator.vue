<script setup lang="ts">
defineProps<{
  line: { x: number; y: number; width: number; height: number } | null
  zoom: number
}>()
</script>

<template>
  <div
    v-if="line"
    :style="{
      position: 'absolute',
      left: `${line.x}px`,
      top: `${line.y}px`,
      width: `${Math.max(line.width, 2 / zoom)}px`,
      height: `${Math.max(line.height, 2 / zoom)}px`,
      background: '#4361ee',
      borderRadius: `${1 / zoom}px`,
      pointerEvents: 'none',
      zIndex: 1000,
    }"
  />
</template>
