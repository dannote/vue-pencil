<script setup lang="ts">
import { computed, ref } from 'vue'

import IconBox from '~icons/lucide/box'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconCircle from '~icons/lucide/circle'
import IconComponent from '~icons/lucide/component'
import IconFrame from '~icons/lucide/frame'
import IconMousePointerSquareDashed from '~icons/lucide/mouse-pointer-square-dashed'
import IconSquare from '~icons/lucide/square'
import IconPanelTop from '~icons/lucide/panel-top'
import IconTextCursorInput from '~icons/lucide/text-cursor-input'
import IconType from '~icons/lucide/type'

import { useDocumentStore } from '@/model/document'
import { isLibraryInstanceRoot, nodeDisplayKind, nodeDisplayName } from '@/model/display'
import type { DesignNode } from '@/model/types'

const props = defineProps<{
  node: DesignNode
  depth?: number
}>()

const store = useDocumentStore()
const expanded = ref(true)

const childNodes = computed(() => props.node.children.filter((child): child is DesignNode => typeof child !== 'string'))
const hasChildren = computed(() => childNodes.value.length > 0)
const selected = computed(() => store.selectedIds.has(props.node.id))
const displayName = computed(() => nodeDisplayName(props.node))
const displayKind = computed(() => nodeDisplayKind(props.node))
const indent = computed(() => `${8 + (props.depth ?? 0) * 14}px`)

const icon = computed(() => {
  if (props.node.meta.slot) return IconPanelTop
  if (isLibraryInstanceRoot(props.node)) return IconComponent
  if (props.node.meta.source?.kind === 'library') return IconMousePointerSquareDashed
  if (props.node.type === 'h1' || props.node.type === 'h2' || props.node.type === 'p' || props.node.type === 'span' || props.node.type === 'label') return IconType
  if (props.node.type === 'input') return IconTextCursorInput
  if (props.node.props.style?.borderRadius === '50%') return IconCircle
  if (props.node.type === 'div' && hasChildren.value) return IconFrame
  if (props.node.type === 'div') return IconSquare
  return IconBox
})

function selectNode() {
  store.select(props.node.id)
}

function toggleExpanded() {
  if (!hasChildren.value) return
  expanded.value = !expanded.value
}
</script>

<template>
  <div>
    <div
      class="group flex items-center gap-1 rounded-md py-1 pr-2 text-xs transition-colors"
      :class="selected ? 'bg-[#4361ee] text-white' : 'text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]'"
      :style="{ paddingLeft: indent }"
    >
      <button
        class="flex size-4 shrink-0 items-center justify-center rounded text-current opacity-70 hover:bg-white/10"
        :class="hasChildren ? '' : 'invisible'"
        @click.stop="toggleExpanded"
      >
        <IconChevronRight class="size-3 transition-transform" :class="expanded ? 'rotate-90' : ''" />
      </button>
      <button class="flex min-w-0 flex-1 items-center gap-2 text-left" @click="selectNode">
        <component :is="icon" class="size-3.5 shrink-0" :class="selected ? 'text-white' : 'text-[#89b4fa]'" />
        <span class="min-w-0 flex-1 truncate font-medium">{{ displayName }}</span>
        <span
          class="hidden shrink-0 rounded bg-[#313244] px-1.5 py-0.5 text-[9px] font-semibold text-[#a6adc8] group-hover:inline"
          :class="selected ? '!bg-white/15 !text-white/80' : ''"
        >
          {{ displayKind }}
        </span>
      </button>
    </div>

    <div v-if="expanded && hasChildren" class="mt-0.5">
      <LayerTreeItem
        v-for="child in childNodes"
        :key="child.id"
        :node="child"
        :depth="(depth ?? 0) + 1"
      />
    </div>
  </div>
</template>
