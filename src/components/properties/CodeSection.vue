<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import { computed, ref } from 'vue'
import { useDocumentStore } from '@/model/document'
import { documentToVueSfc, nodeToVueTemplate } from '@/model/serialize'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()
const expanded = ref(false)
const mode = ref<'template' | 'sfc'>('template')

const relevantCapabilities = computed(() => store.capabilities.filter((capability) => {
  if (!capability.targetNodeId) return true
  return capability.targetNodeId === props.node.id || nodeContains(props.node, capability.targetNodeId)
}))

const relevantBindings = computed(() => store.bindings.filter((binding) => {
  if ('nodeId' in binding.target) return binding.target.nodeId === props.node.id || nodeContains(props.node, binding.target.nodeId)
  return false
}))

const hasDynamicData = computed(() => relevantCapabilities.value.length > 0 || relevantBindings.value.length > 0)

const code = computed(() => {
  if (mode.value === 'template') {
    return nodeToVueTemplate(props.node, 0, store.capabilities, store.bindings)
  }

  return documentToVueSfc({
    root: props.node,
    capabilities: store.capabilities,
    bindings: store.bindings,
  })
})

const summary = computed(() => {
  const parts: string[] = []
  if (relevantCapabilities.value.length > 0) parts.push(`${relevantCapabilities.value.length} capabilities`)
  if (relevantBindings.value.length > 0) parts.push(`${relevantBindings.value.length} bindings`)
  return parts.join(' · ') || 'Static template'
})

async function copy() {
  await navigator.clipboard.writeText(code.value)
}

function nodeContains(node: DesignNode, id: string): boolean {
  for (const child of node.children) {
    if (typeof child === 'string') continue
    if (child.id === id || nodeContains(child, id)) return true
  }
  return false
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Developer preview">
      <template #actions>
        <button
          class="rounded px-1.5 py-0.5 text-[10px] text-[#89b4fa] transition-colors hover:bg-[#313244] hover:text-[#b4befe]"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Hide' : 'Show' }}
        </button>
      </template>
    </SectionHeader>

    <button
      class="flex w-full items-center justify-between rounded-md border border-[#45475a] bg-[#181825] px-2.5 py-2 text-left transition-colors hover:border-[#585b70]"
      @click="expanded = !expanded"
    >
      <span>
        <span class="block text-xs font-medium text-[#cdd6f4]">{{ mode === 'sfc' ? 'Vue SFC output' : 'Template output' }}</span>
        <span class="block text-[10px] text-[#a6adc8]">{{ summary }}</span>
      </span>
      <span
        v-if="hasDynamicData"
        class="rounded-full bg-[#313244] px-2 py-0.5 text-[10px] text-[#94e2d5]"
      >
        Dynamic
      </span>
    </button>

    <div v-if="expanded" class="mt-2 space-y-2">
      <div class="flex rounded-md bg-[#181825] p-0.5">
        <button
          class="flex-1 rounded px-2 py-1 text-[10px] transition-colors"
          :class="mode === 'template' ? 'bg-[#45475a] text-[#cdd6f4]' : 'text-[#a6adc8] hover:text-[#cdd6f4]'"
          @click="mode = 'template'"
        >
          Template
        </button>
        <button
          class="flex-1 rounded px-2 py-1 text-[10px] transition-colors"
          :class="mode === 'sfc' ? 'bg-[#45475a] text-[#cdd6f4]' : 'text-[#a6adc8] hover:text-[#cdd6f4]'"
          @click="mode = 'sfc'"
        >
          Vue SFC
        </button>
      </div>

      <div class="flex items-center justify-between rounded-md bg-[#181825] px-2 py-1 text-[10px] text-[#a6adc8]">
        <span>{{ mode === 'sfc' ? 'Includes generated imports and VueUse capabilities.' : 'Selected node template only.' }}</span>
        <button
          class="text-[#89b4fa] transition-colors hover:text-[#b4befe]"
          @click="copy"
        >
          Copy
        </button>
      </div>

      <pre class="max-h-80 overflow-y-auto overflow-x-auto whitespace-pre rounded-md bg-[#11111b] p-3 font-mono text-[11px] leading-[1.5] text-[#cdd6f4]"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>
