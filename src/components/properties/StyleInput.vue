<script setup lang="ts">
import CssColorPicker from '@/components/CssColorPicker.vue'

const props = defineProps<{
  label: string
  modelValue: string
  type?: 'text' | 'number' | 'color' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  suffix?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label class="flex items-center gap-2">
    <span class="w-8 shrink-0 text-[11px] text-[#a6adc8]">{{ label }}</span>
    <select
      v-if="type === 'select'"
      class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-1.5 text-xs text-[#cdd6f4]"
      :value="modelValue"
      @change="onInput"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <div v-else-if="type === 'color'" class="flex min-w-0 flex-1 items-center gap-1.5">
      <CssColorPicker
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <input
        class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 font-mono text-xs text-[#cdd6f4]"
        :value="modelValue"
        @change="onInput"
      >
    </div>
    <div v-else class="flex min-w-0 flex-1 items-center">
      <input
        :type="type ?? 'text'"
        class="h-7 min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-2 text-xs text-[#cdd6f4]"
        :value="modelValue"
        :placeholder="placeholder"
        @change="onInput"
      >
      <span v-if="suffix" class="-ml-6 text-[10px] text-[#a6adc8]">{{ suffix }}</span>
    </div>
  </label>
</template>
