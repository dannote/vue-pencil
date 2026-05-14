<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DesignNode } from '@/model/types'
import { nodeDisplayName } from '@/model/display'
import { LIBRARY_COMPONENTS } from '@/model/library'
import { useDocumentStore } from '@/model/document'

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
}

const libraryGroups = computed(() => {
  const items: LibraryListItem[] = [
    ...LIBRARY_COMPONENTS,
    ...store.componentDefs.map((component) => ({
      id: `local:${component.id}`,
      name: component.name,
      group: 'Local components',
      description: 'Component created from this file.',
    })),
  ]

  const groups = new Map<string, LibraryListItem[]>()
  for (const component of items) {
    groups.set(component.group, [...(groups.get(component.group) ?? []), component])
  }
  return [...groups.entries()].map(([name, components]) => ({ name, components }))
})

function nodeLabel(node: DesignNode): string {
  return nodeDisplayName(node)
}

function isSelected(id: string): boolean {
  return store.selectedIds.has(id)
}

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
      <div class="px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
        Layers
      </div>
      <div v-for="frame in frames" :key="frame.id" class="mb-2">
        <button
          class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors"
          :class="isSelected(frame.id) ? 'bg-[#4361ee] text-white' : 'text-[#cdd6f4] hover:bg-[#313244]'"
          @click="store.select(frame.id)"
        >
          <span class="text-[10px]">▸</span>
          {{ nodeLabel(frame) }}
        </button>
        <div v-for="child in frame.children" :key="typeof child === 'string' ? child : child.id" class="pl-4">
          <template v-if="typeof child !== 'string'">
            <button
              class="flex w-full items-center gap-2 rounded-md px-3 py-1 text-left text-xs transition-colors"
              :class="isSelected(child.id) ? 'bg-[#4361ee] text-white' : 'text-[#a6adc8] hover:bg-[#313244]'"
              @click="store.select(child.id)"
            >
              {{ nodeLabel(child) }}
            </button>
          </template>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="px-4 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-[#a6adc8]">
        Library
      </div>
      <div class="space-y-4 px-3 pb-4">
        <div v-for="group in libraryGroups" :key="group.name" class="space-y-2">
          <div class="text-[10px] font-medium uppercase tracking-wide text-[#6c7086]">
            {{ group.name }}
          </div>
          <button
            v-for="component in group.components"
            :key="component.id"
            class="w-full rounded-lg border border-[#45475a] bg-[#181825] p-3 text-left transition-colors hover:border-[#89b4fa] hover:bg-[#313244]"
            :title="component.description"
            draggable="true"
            @dragstart="onLibraryDragStart($event, component.id)"
            @click="store.insertLibraryComponent(component.id)"
          >
            <div class="text-xs font-semibold text-[#cdd6f4]">{{ component.name }}</div>
            <div class="mt-1 text-[10px] leading-snug text-[#a6adc8]">{{ component.description }}</div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
