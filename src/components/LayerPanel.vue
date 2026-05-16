<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import IconBookOpen from '~icons/lucide/book-open'
import IconBox from '~icons/lucide/box'
import IconComponent from '~icons/lucide/component'
import IconGripVertical from '~icons/lucide/grip-vertical'
import IconLibrary from '~icons/lucide/library'
import IconPanelTop from '~icons/lucide/panel-top'
import IconListCollapse from '~icons/lucide/list-collapse'
import IconSlidersHorizontal from '~icons/lucide/sliders-horizontal'
import IconSquareCheck from '~icons/lucide/square-check'
import IconToggleRight from '~icons/lucide/toggle-right'

import type { DesignNode } from '@/model/types'
import { LIBRARY_COMPONENTS } from '@/model/library'
import { useDocumentStore } from '@/model/document'
import LayerTreeItem from './LayerTreeItem.vue'

defineProps<{
  frames: DesignNode[]
}>()

const store = useDocumentStore()
const tab = ref<'layers' | 'library'>('layers')

interface LibraryListItem {
  id: string
  name: string
  group: string
  description: string
  source: string
  icon: Component
}

const libraryGroups = computed(() => {
  const items: LibraryListItem[] = [
    ...LIBRARY_COMPONENTS.map((component) => ({
      ...component,
      source: component.id.startsWith('layout.') ? 'vue-pencil' : 'reka-ui',
      icon: component.id === 'layout.card'
        ? IconPanelTop
        : component.id === 'reka.switch'
        ? IconToggleRight
        : component.id === 'reka.checkbox'
          ? IconSquareCheck
          : component.id === 'reka.slider'
            ? IconSlidersHorizontal
            : component.id === 'reka.tabs'
              ? IconBookOpen
              : component.id === 'reka.accordion' || component.id === 'reka.collapsible'
                ? IconListCollapse
                : IconBox,
    })),
    ...store.componentDefs.map((component) => ({
      id: `local:${component.id}`,
      name: component.name,
      group: 'Local components',
      description: 'Component created from this file.',
      source: 'local',
      icon: IconComponent,
    })),
  ]

  const groups = new Map<string, LibraryListItem[]>()
  for (const component of items) {
    groups.set(component.group, [...(groups.get(component.group) ?? []), component])
  }
  return [...groups.entries()].map(([name, components]) => ({ name, components }))
})

function onLibraryDragStart(event: DragEvent, componentId: string) {
  event.dataTransfer?.setData('application/x-vue-pencil-library-component', componentId)
  event.dataTransfer?.setData('text/plain', componentId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="fixed top-10 left-0 bottom-0 z-40 w-60 overflow-y-auto border-r border-[var(--vp-bg-hover)] bg-[var(--vp-bg-panel)]">
    <div class="grid grid-cols-2 gap-1 p-2">
      <button
        class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        :class="tab === 'layers' ? 'bg-[var(--vp-border-strong)] text-[var(--vp-text-primary)]' : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-bg-hover)]'"
        @click="tab = 'layers'"
      >
        Layers
      </button>
      <button
        class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        :class="tab === 'library' ? 'bg-[var(--vp-border-strong)] text-[var(--vp-text-primary)]' : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-bg-hover)]'"
        @click="tab = 'library'"
      >
        Library
      </button>
    </div>

    <template v-if="tab === 'layers'">
      <div class="flex items-center justify-between px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--vp-text-secondary)]">
        <span>Layers</span>
        <span class="rounded bg-[var(--vp-bg-hover)] px-1.5 py-0.5 text-[9px] tracking-normal text-[var(--vp-text-tertiary)]">{{ frames.length }}</span>
      </div>
      <div class="space-y-0.5 px-2 pb-4">
        <LayerTreeItem v-for="frame in frames" :key="frame.id" :node="frame" />
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-2 px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--vp-text-secondary)]">
        <IconLibrary class="size-3.5" />
        <span>Assets</span>
      </div>
      <div class="space-y-4 px-3 pb-4">
        <div v-for="group in libraryGroups" :key="group.name" class="space-y-1.5">
          <div class="px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--vp-text-tertiary)]">
            {{ group.name }}
          </div>
          <button
            v-for="component in group.components"
            :key="component.id"
            class="group flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent px-2 py-2 text-left transition-colors hover:border-[var(--vp-border-strong)] hover:bg-[var(--vp-bg-hover)]"
            :title="component.description"
            draggable="true"
            @dragstart="onLibraryDragStart($event, component.id)"
            @click="store.insertLibraryComponent(component.id)"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--vp-bg-panel-raised)] text-[var(--vp-accent-hover)] ring-1 ring-[var(--vp-border-strong)] transition-colors group-hover:ring-[var(--vp-accent-hover)]">
              <component :is="component.icon" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-semibold text-[var(--vp-text-primary)]">{{ component.name }}</span>
              <span class="mt-0.5 block truncate text-[10px] text-[var(--vp-text-secondary)]">{{ component.description }}</span>
              <span class="mt-1 inline-flex rounded bg-[var(--vp-bg-hover)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--vp-info)]">{{ component.source }}</span>
            </span>
            <IconGripVertical class="size-3.5 shrink-0 text-[var(--vp-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
