<script setup lang="ts">
import { computed } from 'vue'
import type { DesignNode, FrameLayout } from '@/model/types'
import { useDocumentStore } from '@/model/document'

import PositionSection from './properties/PositionSection.vue'
import LayoutSection from './properties/LayoutSection.vue'
import AppearanceSection from './properties/AppearanceSection.vue'
import TypographySection from './properties/TypographySection.vue'
import FillSection from './properties/FillSection.vue'
import BorderSection from './properties/BorderSection.vue'
import EffectsSection from './properties/EffectsSection.vue'
import CodeSection from './properties/CodeSection.vue'

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

function onStyleChange(prop: string, value: string) {
  if (!node.value) return
  store.updateNodeStyle(node.value.id, { [prop]: value })
}

function onFrameChange(prop: keyof FrameLayout, value: number) {
  if (!node.value) return
  if (prop === 'x' || prop === 'y') {
    store.updateFramePos(
      node.value.id,
      prop === 'x' ? value : layout.value!.x,
      prop === 'y' ? value : layout.value!.y,
    )
  } else {
    store.updateFrameSize(
      node.value.id,
      prop === 'width' ? value : layout.value!.width,
      prop === 'height' ? value : layout.value!.height,
    )
  }
}
</script>

<template>
  <div class="fixed top-10 right-0 bottom-0 z-40 w-72 overflow-y-auto border-l border-[#313244] bg-[#1e1e2e]">
    <template v-if="node">
      <!-- Header -->
      <div class="flex items-center gap-1.5 border-b border-[#313244] px-4 py-2">
        <span class="text-[11px] text-[#a6adc8]">&lt;{{ node.type }}&gt;</span>
        <span class="text-xs font-semibold text-[#cdd6f4]">{{ node.meta.name ?? node.type }}</span>
      </div>

      <PositionSection
        :node="node"
        :layout="layout"
        @style="onStyleChange"
        @frame="onFrameChange"
      />
      <LayoutSection
        :node="node"
        @style="onStyleChange"
      />
      <AppearanceSection
        :node="node"
        @style="onStyleChange"
      />
      <TypographySection
        :node="node"
        @style="onStyleChange"
      />
      <FillSection
        :node="node"
        @style="onStyleChange"
      />
      <BorderSection
        :node="node"
        @style="onStyleChange"
      />
      <EffectsSection
        :node="node"
        @style="onStyleChange"
      />
      <CodeSection :node="node" />
    </template>

    <div v-else class="px-4 py-8 text-center text-xs text-[#a6adc8]">
      Select an element
    </div>
  </div>
</template>
