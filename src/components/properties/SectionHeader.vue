<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="mb-2 flex items-center justify-between">
    <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">{{ title }}</div>
    <slot name="actions" />
  </div>
</template>
