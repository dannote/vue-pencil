<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import IconBox from '~icons/lucide/box'
import IconComponent from '~icons/lucide/component'
import IconGripVertical from '~icons/lucide/grip-vertical'
import IconLibrary from '~icons/lucide/library'
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
      source: 'reka-ui',
      icon: component.id === 'reka-switch' ? IconToggleRight : IconBox,
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
  <div class="fixed top-10 left-0 bottom-0 z-40 w-60 overflow-y-auto border-r border-[#313244] bg-[#1e1e2e]">
    <div class="grid grid-cols-2 gap-1 p-2">
      <button
        class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        :class="tab === 'layers' ? 'bg-[#45475a] text-[#cdd6f4]' : 'text-[#a6adc8] hover:bg-[#313244]'"
        @click="tab = 'layers'"
      >
        Layers
      </button>
      <button
        class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        :class="tab === 'library' ? 'bg-[#45475a] text-[#cdd6f4]' : 'text-[#a6adc8] hover:bg-[#313244]'"
        @click="tab = 'library'"
      >
        Library
      </button>
    </div>

    <template v-if="tab === 'layers'">
      <div class="flex items-center justify-between px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
        <span>Layers</span>
        <span class="rounded bg-[#313244] px-1.5 py-0.5 text-[9px] tracking-normal text-[#6c7086]">{{ frames.length }}</span>
      </div>
      <div class="space-y-0.5 px-2 pb-4">
        <LayerTreeItem v-for="frame in frames" :key="frame.id" :node="frame" />
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-2 px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
        <IconLibrary class="size-3.5" />
        <span>Assets</span>
      </div>
      <div class="space-y-4 px-3 pb-4">
        <div v-for="group in libraryGroups" :key="group.name" class="space-y-1.5">
          <div class="px-1 text-[10px] font-semibold uppercase tracking-wide text-[#6c7086]">
            {{ group.name }}
          </div>
          <button
            v-for="component in group.components"
            :key="component.id"
            class="group flex w-full items-center gap-2 rounded-lg border border-transparent bg-transparent px-2 py-2 text-left transition-colors hover:border-[#45475a] hover:bg-[#313244]"
            :title="component.description"
            draggable="true"
            @dragstart="onLibraryDragStart($event, component.id)"
            @click="store.insertLibraryComponent(component.id)"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#181825] text-[#89b4fa] ring-1 ring-[#45475a] transition-colors group-hover:ring-[#89b4fa]">
              <component :is="component.icon" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-semibold text-[#cdd6f4]">{{ component.name }}</span>
              <span class="mt-0.5 block truncate text-[10px] text-[#a6adc8]">{{ component.description }}</span>
              <span class="mt-1 inline-flex rounded bg-[#313244] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#94e2d5]">{{ component.source }}</span>
            </span>
            <IconGripVertical class="size-3.5 shrink-0 text-[#6c7086] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
