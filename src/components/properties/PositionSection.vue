<script setup lang="ts">
import type { DesignNode, FrameLayout } from '@/model/types'
import ScrubInput from '@/components/ScrubInput.vue'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
  layout: FrameLayout | null
}>()

const emit = defineEmits<{
  style: [prop: string, value: string]
  frame: [prop: keyof FrameLayout, value: number]
}>()
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-2">
    <SectionHeader title="Position" />
    <div v-if="layout" class="flex flex-col gap-1.5">
      <div class="flex gap-1.5">
        <ScrubInput
          icon="X"
          :model-value="Math.round(layout.x)"
          @update:model-value="emit('frame', 'x', $event)"
        />
        <ScrubInput
          icon="Y"
          :model-value="Math.round(layout.y)"
          @update:model-value="emit('frame', 'y', $event)"
        />
      </div>
      <div class="flex gap-1.5">
        <ScrubInput
          icon="W"
          :model-value="Math.round(layout.width)"
          :min="1"
          @update:model-value="emit('frame', 'width', $event)"
        />
        <ScrubInput
          icon="H"
          :model-value="Math.round(layout.height)"
          :min="1"
          @update:model-value="emit('frame', 'height', $event)"
        />
      </div>
    </div>
    <div v-else class="flex gap-1.5">
      <label class="flex min-w-0 flex-1 items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">W</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          :value="node.props.style?.width ?? ''"
          placeholder="auto"
          @change="emit('style', 'width', ($event.target as HTMLInputElement).value)"
        >
      </label>
      <label class="flex min-w-0 flex-1 items-center gap-1.5">
        <span class="w-3 text-[10px] font-medium text-[#a6adc8]">H</span>
        <input
          class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
          :value="node.props.style?.height ?? ''"
          placeholder="auto"
          @change="emit('style', 'height', ($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </div>
</template>
