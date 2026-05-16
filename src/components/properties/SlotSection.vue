<script setup lang="ts">
import { computed } from 'vue'
import { LIBRARY_COMPONENTS } from '@/model/library'
import { useDocumentStore } from '@/model/document'
import type { DesignNode } from '@/model/types'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()
const slot = computed(() => props.node.meta.slot)
const childCount = computed(() => props.node.children.filter(child => typeof child !== 'string').length)
const preferredComponents = computed(() => {
  const preferred = slot.value?.preferredComponents ?? []
  return preferred
    .map(id => LIBRARY_COMPONENTS.find(component => component.id === id))
    .filter(component => component !== undefined)
})

const assetGroups = computed(() => {
  const groups = new Map<string, typeof LIBRARY_COMPONENTS>()
  for (const component of LIBRARY_COMPONENTS) {
    groups.set(component.group, [...(groups.get(component.group) ?? []), component])
  }
  return [...groups.entries()].map(([name, components]) => ({ name, components }))
})

function addAsset(componentId: string) {
  if (!componentId) return
  store.insertLibraryComponentInto(componentId, props.node.id)
}
</script>

<template>
  <div v-if="slot" class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Slot" />
    <div class="rounded-lg border border-[#f472b6]/45 bg-[#181825] p-2.5">
      <div class="flex items-center justify-between gap-2">
        <div>
          <div class="text-xs font-semibold text-[#f9a8d4]">{{ slot.label }}</div>
          <div class="text-[10px] text-[#a6adc8]">{{ slot.name }}</div>
        </div>
        <span class="rounded-full bg-[#3b2037] px-2 py-0.5 text-[10px] text-[#f9a8d4]">Slot</span>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-[#a6adc8]">
        <div class="rounded-md bg-[#11111b] px-2 py-1.5">
          <div class="uppercase tracking-wide text-[#6c7086]">Content</div>
          <div class="mt-0.5 text-[#cdd6f4]">{{ childCount }} layers</div>
        </div>
        <div class="rounded-md bg-[#11111b] px-2 py-1.5">
          <div class="uppercase tracking-wide text-[#6c7086]">Accepts</div>
          <div class="mt-0.5 text-[#cdd6f4]">{{ slot.accepts?.join(', ') || 'Any layer' }}</div>
        </div>
      </div>
      <div v-if="preferredComponents.length" class="mt-3 space-y-1.5">
        <div class="text-[10px] font-semibold uppercase tracking-wide text-[#6c7086]">Add preferred asset</div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="component in preferredComponents"
            :key="component.id"
            class="rounded-md border border-[#45475a] bg-[#11111b] px-2 py-1.5 text-left text-[11px] font-semibold text-[#cdd6f4] transition-colors hover:border-[#f9a8d4] hover:bg-[#313244]"
            @click="addAsset(component.id)"
          >
            {{ component.name }}
          </button>
        </div>
      </div>

      <label class="mt-3 block space-y-1.5">
        <span class="text-[10px] font-semibold uppercase tracking-wide text-[#6c7086]">Add any asset</span>
        <select
          class="w-full rounded-md border border-[#45475a] bg-[#11111b] px-2 py-1.5 text-xs text-[#cdd6f4] outline-none focus:border-[#f9a8d4]"
          value=""
          @change="addAsset(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
        >
          <option value="">Choose asset…</option>
          <optgroup v-for="group in assetGroups" :key="group.name" :label="group.name">
            <option v-for="component in group.components" :key="component.id" :value="component.id">
              {{ component.name }}
            </option>
          </optgroup>
        </select>
      </label>
    </div>
  </div>
</template>
