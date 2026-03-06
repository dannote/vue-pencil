<script setup lang="ts">
import type { DesignNode } from '@/model/types'
import { computed } from 'vue'
import { nodeToVueTemplate } from '@/model/serialize'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const code = computed(() => nodeToVueTemplate(props.node))

async function copy() {
  await navigator.clipboard.writeText(code.value)
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Code">
      <template #actions>
        <button
          class="text-[10px] text-[#89b4fa] transition-colors hover:text-[#b4befe]"
          @click="copy"
        >
          Copy
        </button>
      </template>
    </SectionHeader>
    <pre class="max-h-64 overflow-y-auto overflow-x-auto whitespace-pre rounded-md bg-[#11111b] p-3 font-mono text-[11px] leading-[1.5] text-[#cdd6f4]"><code>{{ code }}</code></pre>
  </div>
</template>
