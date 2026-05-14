<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import { useDocumentStore } from '@/model/document'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()

function createComponent() {
  store.recordHistory()
  store.createComponentFromNode(props.node.id)
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Component tools" />
    <button
      class="w-full rounded-lg border border-[#45475a] bg-[#181825] px-3 py-2 text-left transition-colors hover:border-[#89b4fa] hover:bg-[#313244]"
      @click="createComponent"
    >
      <div class="text-xs font-semibold text-[#cdd6f4]">Create component</div>
      <div class="mt-1 text-[10px] text-[#a6adc8]">Save this node as a local library component.</div>
    </button>
  </div>
</template>
