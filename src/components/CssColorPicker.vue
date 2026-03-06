<script setup lang="ts">
import { computed } from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  ColorAreaRoot,
  ColorAreaArea,
  ColorAreaThumb,
  ColorSliderRoot,
  ColorSliderTrack,
  ColorSliderThumb,
  ColorFieldRoot,
  ColorFieldInput,
  normalizeColor,
  colorToHex,
  type Color as RekaColor,
} from 'reka-ui'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function cssToHex(css: string): string {
  if (!css || css === 'transparent') return '#000000'
  if (css.startsWith('#')) return css
  if (css.startsWith('rgb')) {
    const m = css.match(/(\d+)/g)
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
    }
  }
  // Named colors — use a canvas to resolve
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = css
  return ctx.fillStyle
}

const rekaColor = computed(() => normalizeColor(cssToHex(props.modelValue)))

const swatchStyle = computed(() => {
  const v = props.modelValue
  if (!v) return 'background: transparent; background-image: linear-gradient(45deg, #666 25%, transparent 25%), linear-gradient(-45deg, #666 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #666 75%), linear-gradient(-45deg, transparent 75%, #666 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0; background-color: #444'
  return `background: ${v}`
})

function onColorUpdate(c: RekaColor) {
  emit('update:modelValue', colorToHex(c))
}

function onHexUpdate(hex: string) {
  emit('update:modelValue', hex)
}
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <button
        class="size-6 shrink-0 cursor-pointer rounded border border-[#45475a] p-0"
        :style="swatchStyle"
      />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-[100] w-56 rounded-lg border border-[#45475a] bg-[#1e1e2e] p-2 shadow-xl"
        :side-offset="4"
        side="left"
      >
        <div class="flex flex-col gap-2">
          <ColorAreaRoot
            v-slot="{ style }"
            :model-value="rekaColor"
            color-space="hsb"
            x-channel="saturation"
            y-channel="brightness"
            @update:color="onColorUpdate"
          >
            <ColorAreaArea
              class="relative h-[140px] w-full cursor-crosshair overflow-hidden rounded"
              :style="style"
            >
              <ColorAreaThumb
                class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
              />
            </ColorAreaArea>
          </ColorAreaRoot>

          <ColorSliderRoot
            :model-value="rekaColor"
            channel="hue"
            color-space="hsb"
            class="relative flex h-3 w-full items-center"
            @update:color="onColorUpdate"
          >
            <ColorSliderTrack class="h-full w-full rounded-md" />
            <ColorSliderThumb
              class="absolute size-3.5 cursor-pointer rounded-full border-2 border-white shadow-sm"
            />
          </ColorSliderRoot>

          <div class="checkerboard relative h-3 w-full rounded-md">
            <ColorSliderRoot
              :model-value="rekaColor"
              channel="alpha"
              color-space="hsb"
              class="absolute inset-0 flex items-center"
              @update:color="onColorUpdate"
            >
              <ColorSliderTrack class="h-full w-full rounded-md" />
              <ColorSliderThumb
                class="absolute size-3.5 cursor-pointer rounded-full border-2 border-white shadow-sm"
              />
            </ColorSliderRoot>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-[11px] text-[#a6adc8]">#</span>
            <ColorFieldRoot
              :model-value="cssToHex(modelValue)"
              class="min-w-0 flex-1"
              @update:model-value="onHexUpdate"
            >
              <ColorFieldInput
                class="w-full rounded border border-[#45475a] bg-[#313244] px-1.5 py-0.5 font-mono text-xs text-[#cdd6f4]"
              />
            </ColorFieldRoot>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
.checkerboard {
  background-image:
    linear-gradient(45deg, #444 25%, transparent 25%),
    linear-gradient(-45deg, #444 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #444 75%),
    linear-gradient(-45deg, transparent 75%, #444 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
  background-color: #333;
}
</style>
