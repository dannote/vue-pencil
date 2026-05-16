<script setup lang="ts">
export interface ToastMessage {
  id: string
  text: string
}

defineProps<{
  messages: ToastMessage[]
}>()
</script>

<template>
  <div class="pointer-events-none fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-2">
    <div
      v-for="message in messages"
      :key="message.id"
      class="rounded-xl border border-[#45475a] bg-[#1e1e2e]/95 px-3 py-2 text-xs font-semibold text-[#cdd6f4] shadow-2xl shadow-black/30 backdrop-blur"
    >
      {{ message.text }}
    </div>
  </div>
</template>
