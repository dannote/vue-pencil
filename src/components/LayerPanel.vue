<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import { useDocumentStore } from '@/model/document'

defineProps<{
  frames: DesignNode[]
}>()

const store = useDocumentStore()

function nodeLabel(node: DesignNode): string {
  return node.meta.name ?? `<${node.type}>`
}

function isSelected(id: string): boolean {
  return store.selectedIds.has(id)
}
</script>

<template>
  <div class="fixed top-10 left-0 bottom-0 w-60 bg-[#1e1e2e] border-r border-[#313244] z-40 overflow-y-auto">
    <div class="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
      Layers
    </div>
    <div v-for="frame in frames" :key="frame.id" class="mb-2">
      <button
        class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-xs transition-colors"
        :class="isSelected(frame.id) ? 'bg-[#4361ee] text-white' : 'text-[#cdd6f4] hover:bg-[#313244]'"
        @click="store.select(frame.id)"
      >
        <span class="text-[10px]">▸</span>
        {{ nodeLabel(frame) }}
      </button>
      <div v-for="child in frame.children" :key="typeof child === 'string' ? child : child.id" class="pl-4">
        <template v-if="typeof child !== 'string'">
          <button
            class="w-full flex items-center gap-2 px-3 py-1 rounded-md text-left text-xs transition-colors"
            :class="isSelected(child.id) ? 'bg-[#4361ee] text-white' : 'text-[#a6adc8] hover:bg-[#313244]'"
            @click="store.select(child.id)"
          >
            {{ nodeLabel(child) }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
