<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentPropertyContract } from '@/model/component-contracts'
import type { DesignNode } from '@/model/types'
import { bindableValues, bindingSourceId } from '@/model/bindings'
import { componentPartNodes, componentPropertyTarget, getComponentContract } from '@/model/component-contracts'
import { useDocumentStore } from '@/model/document'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()
const contract = computed(() => getComponentContract(props.node))
const values = computed(() => bindableValues(store.capabilities, store.frames))
const parts = computed(() => contract.value ? componentPartNodes(props.node, contract.value) : [])

function propertyValues(property: ComponentPropertyContract) {
  return values.value.filter((value) => property.accepts.includes(value.type))
}

function selectedSource(property: ComponentPropertyContract): string {
  const binding = store.bindingForTarget(componentPropertyTarget(props.node, property))
  return binding ? bindingSourceId(binding.source) : ''
}

function bindProperty(property: ComponentPropertyContract, sourceId: string) {
  const target = componentPropertyTarget(props.node, property)
  const binding = store.bindingForTarget(target)

  if (!sourceId) {
    if (binding) {
      store.recordHistory()
      store.removeBinding(binding.id)
    }
    return
  }

  const value = values.value.find((candidate) => candidate.id === sourceId)
  if (!value) return
  store.recordHistory()
  store.addBinding(target, value.source)
}
</script>

<template>
  <div v-if="contract" class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Component" />

    <div class="rounded-lg border border-[#45475a] bg-[#181825] p-2.5">
      <div class="flex items-center justify-between gap-2">
        <div>
          <div class="text-xs font-semibold text-[#cdd6f4]">{{ contract.label }}</div>
          <div class="text-[10px] text-[#a6adc8]">{{ contract.library }}</div>
        </div>
        <span class="rounded-full bg-[#313244] px-2 py-0.5 text-[10px] text-[#94e2d5]">
          Instance
        </span>
      </div>

      <div v-if="parts.length > 0" class="mt-3 space-y-1.5">
        <div class="text-[10px] font-medium uppercase tracking-wide text-[#6c7086]">Parts</div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="part in parts"
            :key="part.contract.id"
            class="rounded-md border border-[#45475a] bg-[#11111b] px-2 py-1.5 text-left text-[11px] text-[#cdd6f4] transition-colors hover:border-[#89b4fa] hover:bg-[#313244]"
            :class="store.selectedIds.has(part.node.id) ? 'border-[#89b4fa] bg-[#313244]' : ''"
            @click="store.select(part.node.id)"
          >
            {{ part.contract.label }}
          </button>
        </div>
      </div>

      <div class="mt-3 space-y-2">
        <label
          v-for="property in contract.properties"
          :key="property.id"
          class="block space-y-1"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-medium text-[#cdd6f4]">{{ property.label }}</span>
            <span class="text-[9px] text-[#6c7086]" :title="property.targetProp">{{ property.accepts.join(', ') }}</span>
          </div>
          <select
            class="w-full rounded-md border border-[#45475a] bg-[#11111b] px-2 py-1.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
            :value="selectedSource(property)"
            @change="bindProperty(property, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Static / unbound</option>
            <option
              v-for="value in propertyValues(property)"
              :key="value.id"
              :value="value.id"
            >
              {{ value.label }}
            </option>
          </select>
          <div class="text-[10px] text-[#6c7086]">{{ property.description }}</div>
        </label>
      </div>
    </div>
  </div>
</template>
