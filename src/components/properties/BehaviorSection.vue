<script setup lang="ts">
import { computed } from 'vue'
import type { CapabilityInstance, DesignNode } from '@/model/types'
import { CAPABILITY_DEFINITIONS, getCapabilityDefinition } from '@/model/capabilities'
import { useDocumentStore } from '@/model/document'
import { findNode } from '@/model/operations'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()

const nodeCapabilities = computed(() => store.capabilitiesForNode(props.node.id))
const componentCapabilities = computed(() => store.capabilities.filter((capability) => !capability.targetNodeId))
const activeCapabilities = computed(() => [...componentCapabilities.value, ...nodeCapabilities.value])

const addableGroups = computed(() => {
  const available = CAPABILITY_DEFINITIONS.filter((definition) => {
    if (definition.scope === 'element') {
      return !nodeCapabilities.value.some((capability) => capability.definitionId === definition.id)
    }

    return !componentCapabilities.value.some((capability) => capability.definitionId === definition.id)
  })

  return [
    { title: 'Theme', items: available.filter((definition) => definition.category === 'browser') },
    { title: 'State', items: available.filter((definition) => definition.category === 'state') },
    { title: 'Element', items: available.filter((definition) => definition.category === 'element') },
  ].filter((group) => group.items.length > 0)
})

function addCapability(definitionId: string) {
  const definition = getCapabilityDefinition(definitionId)
  if (!definition) return
  store.recordHistory()
  store.addCapability(definitionId, definition.scope === 'element' ? props.node.id : undefined)
}

function targetLabel(capability: CapabilityInstance): string {
  if (!capability.targetNodeId) return 'Whole component'

  for (const frame of store.frames) {
    const target = findNode(frame, capability.targetNodeId)
    if (target) return target.meta.name ?? target.type
  }

  return 'Selected element'
}

function outputLabel(label: string): string {
  return label.replace(/^Element /, '')
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Capabilities" />

    <div class="space-y-3">
      <div v-if="activeCapabilities.length > 0" class="space-y-2">
        <div
          v-for="capability in activeCapabilities"
          :key="capability.id"
          class="rounded-lg border border-[#45475a] bg-[#181825] p-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-semibold text-[#cdd6f4]">
                {{ getCapabilityDefinition(capability.definitionId)?.label ?? capability.definitionId }}
              </div>
              <div class="mt-0.5 text-[10px] text-[#a6adc8]">
                {{ targetLabel(capability) }} · Hybrid/client
              </div>
            </div>
            <button
              class="rounded px-1.5 py-0.5 text-[10px] text-[#f38ba8] transition-colors hover:bg-[#313244] hover:text-[#eba0ac]"
              @click="store.removeCapability(capability.id)"
            >
              Remove
            </button>
          </div>

          <div class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="output in capability.outputs"
              :key="output.id"
              class="rounded-full bg-[#313244] px-2 py-0.5 text-[10px] text-[#94e2d5]"
              :title="output.localName"
            >
              {{ outputLabel(output.label) }}
            </span>
          </div>
        </div>
      </div>

      <div v-for="group in addableGroups" :key="group.title" class="space-y-1.5">
        <div class="text-[10px] font-medium uppercase tracking-wide text-[#6c7086]">
          {{ group.title }}
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="definition in group.items"
            :key="definition.id"
            class="rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 text-left transition-colors hover:border-[#89b4fa] hover:bg-[#313244]"
            :title="definition.description"
            @click="addCapability(definition.id)"
          >
            <div class="text-[11px] font-medium text-[#cdd6f4]">{{ definition.label }}</div>
            <div class="text-[9px] text-[#6c7086]">{{ definition.scope === 'element' ? 'Selected element' : 'Component' }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
