<script setup lang="ts">
import { computed } from 'vue'
import type { DesignNode, FrameLayout } from '@/model/types'
import { useDocumentStore } from '@/model/document'

const store = useDocumentStore()

const node = computed<DesignNode | null>(() => store.selectedNodes[0] ?? null)

const isFrame = computed(() => {
  if (!node.value) return false
  return store.frames.some((f) => f.id === node.value!.id)
})

const layout = computed<FrameLayout | null>(() => {
  if (!node.value || !isFrame.value) return null
  return store.frameLayout[node.value.id] ?? null
})

function getStyle(prop: string): string {
  return node.value?.props.style?.[prop] ?? ''
}

function setStyle(prop: string, value: string) {
  if (!node.value) return
  store.updateNodeStyle(node.value.id, { [prop]: value })
}

function setFrameLayout(prop: keyof FrameLayout, value: string) {
  if (!node.value || !layout.value) return
  const num = parseFloat(value)
  if (isNaN(num)) return
  if (prop === 'x' || prop === 'y') {
    store.updateFramePos(node.value.id, prop === 'x' ? num : layout.value.x, prop === 'y' ? num : layout.value.y)
  } else {
    store.updateFrameSize(node.value.id, prop === 'width' ? num : layout.value.width, prop === 'height' ? num : layout.value.height)
  }
}
</script>

<template>
  <div class="fixed top-10 right-0 bottom-0 w-60 bg-[#1e1e2e] border-l border-[#313244] z-40 overflow-y-auto">
    <template v-if="node">
      <div class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
        {{ node.meta.name ?? `<${node.type}>` }}
      </div>

      <!-- Frame position/size -->
      <div v-if="layout" class="border-b border-[#313244] px-4 py-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8] mb-2">Frame</div>
        <div class="grid grid-cols-2 gap-2 mb-1.5">
          <label v-for="prop in (['x', 'y', 'width', 'height'] as const)" :key="prop">
            <span class="text-[10px] text-[#a6adc8] uppercase">{{ prop === 'width' ? 'W' : prop === 'height' ? 'H' : prop.toUpperCase() }}</span>
            <input
              class="w-full h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs"
              :value="layout[prop]"
              @change="setFrameLayout(prop, ($event.target as HTMLInputElement).value)"
            >
          </label>
        </div>
      </div>

      <!-- Layout -->
      <div class="border-b border-[#313244] px-4 py-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8] mb-2">Layout</div>
        <label class="flex items-center gap-2 mb-1.5">
          <span class="w-8 text-[11px] text-[#a6adc8]">Disp</span>
          <select
            class="flex-1 h-7 bg-[#313244] border border-[#45475a] rounded px-1.5 text-[#cdd6f4] text-xs"
            :value="getStyle('display')"
            @change="setStyle('display', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">–</option>
            <option value="block">Block</option>
            <option value="flex">Flex</option>
            <option value="grid">Grid</option>
            <option value="inline-flex">Inline Flex</option>
            <option value="none">None</option>
          </select>
        </label>
        <label class="flex items-center gap-2 mb-1.5">
          <span class="w-8 text-[11px] text-[#a6adc8]">Gap</span>
          <input class="flex-1 h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('gap')" @change="setStyle('gap', ($event.target as HTMLInputElement).value)">
        </label>
        <label class="flex items-center gap-2 mb-1.5">
          <span class="w-8 text-[11px] text-[#a6adc8]">Pad</span>
          <input class="flex-1 h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('padding')" @change="setStyle('padding', ($event.target as HTMLInputElement).value)">
        </label>
      </div>

      <!-- Background -->
      <div class="border-b border-[#313244] px-4 py-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8] mb-2">Fill</div>
        <label class="flex items-center gap-2 mb-1.5">
          <span class="w-8 text-[11px] text-[#a6adc8]">BG</span>
          <input class="flex-1 h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('background') || getStyle('backgroundColor')" @change="setStyle('background', ($event.target as HTMLInputElement).value)">
        </label>
      </div>

      <!-- Border -->
      <div class="border-b border-[#313244] px-4 py-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8] mb-2">Border</div>
        <label class="flex items-center gap-2 mb-1.5">
          <span class="w-8 text-[11px] text-[#a6adc8]">Rad</span>
          <input class="flex-1 h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('borderRadius')" @change="setStyle('borderRadius', ($event.target as HTMLInputElement).value)">
        </label>
      </div>

      <!-- Size (non-frame elements) -->
      <div v-if="!isFrame" class="border-b border-[#313244] px-4 py-2">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8] mb-2">Size</div>
        <div class="grid grid-cols-2 gap-2">
          <label>
            <span class="text-[10px] text-[#a6adc8]">W</span>
            <input class="w-full h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('width')" @change="setStyle('width', ($event.target as HTMLInputElement).value)">
          </label>
          <label>
            <span class="text-[10px] text-[#a6adc8]">H</span>
            <input class="w-full h-7 bg-[#313244] border border-[#45475a] rounded px-2 text-[#cdd6f4] text-xs" :value="getStyle('height')" @change="setStyle('height', ($event.target as HTMLInputElement).value)">
          </label>
        </div>
      </div>
    </template>

    <div v-else class="px-4 py-8 text-[#a6adc8] text-center text-xs">
      Select an element
    </div>
  </div>
</template>
