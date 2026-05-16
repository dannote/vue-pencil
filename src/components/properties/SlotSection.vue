<script setup lang="ts">
import { computed } from 'vue'
import type { DesignNode } from '@/model/types'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const slot = computed(() => props.node.meta.slot)
const childCount = computed(() => props.node.children.filter(child => typeof child !== 'string').length)
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
      <div v-if="slot.preferredComponents?.length" class="mt-2 text-[10px] text-[#a6adc8]">
        Preferred: {{ slot.preferredComponents.join(', ') }}
      </div>
    </div>
  </div>
</template>
