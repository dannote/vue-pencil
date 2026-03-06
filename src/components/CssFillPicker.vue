<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  convertToRgb,
  type Color as RekaColor,
} from 'reka-ui'
import ScrubInput from './ScrubInput.vue'

type FillMode = 'solid' | 'linear' | 'radial'

interface GradientStop {
  color: string
  alpha: number
  position: number
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeStopIndex = ref(0)

function resolveNamedColor(css: string): string {
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = css
  return ctx.fillStyle
}

function cssToHex(css: string): string {
  if (!css || css === 'transparent') return '#000000'
  if (css.startsWith('#')) return css.slice(0, 7)
  if (css.startsWith('rgb')) {
    const m = css.match(/[\d.]+/g)
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map(n => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')
    }
  }
  return resolveNamedColor(css).slice(0, 7)
}

function cssToAlpha(css: string): number {
  if (!css || css === 'transparent') return 0
  if (css.startsWith('#') && css.length === 9) return parseInt(css.slice(7, 9), 16) / 255
  if (css.startsWith('rgba')) {
    const m = css.match(/[\d.]+/g)
    if (m && m.length >= 4) return Number(m[3])
  }
  return 1
}

function hexAlphaToRgba(hex: string, alpha: number): string {
  if (alpha >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
}

function parseGradient(value: string): { mode: FillMode; angle: number; stops: GradientStop[] } | null {
  const linearMatch = value.match(/^linear-gradient\((.+)\)$/i)
  const radialMatch = value.match(/^radial-gradient\((.+)\)$/i)

  if (!linearMatch && !radialMatch) return null

  const mode: FillMode = linearMatch ? 'linear' : 'radial'
  const inner = (linearMatch ?? radialMatch)![1]

  // Split by commas not inside parentheses
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of inner) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current.trim())

  let angle = 180
  let startIdx = 0

  if (mode === 'linear') {
    const angleStr = parts[0]
    const degMatch = angleStr.match(/^([\d.]+)deg$/)
    const dirMatch = angleStr.match(/^to\s+(.+)$/)
    if (degMatch) {
      angle = Number(degMatch[1])
      startIdx = 1
    } else if (dirMatch) {
      const dir = dirMatch[1].trim()
      const dirMap: Record<string, number> = {
        top: 0, right: 90, bottom: 180, left: 270,
        'top right': 45, 'right top': 45,
        'bottom right': 135, 'right bottom': 135,
        'bottom left': 225, 'left bottom': 225,
        'top left': 315, 'left top': 315,
      }
      if (dir in dirMap) angle = dirMap[dir]
      startIdx = 1
    }
  } else {
    // Skip radial shape description if present
    if (parts[0] && !parts[0].match(/#|rgb|hsl|[a-z]+\s+\d/i)) {
      startIdx = 1
    }
  }

  const stops: GradientStop[] = []
  for (let i = startIdx; i < parts.length; i++) {
    const part = parts[i].trim()
    const posMatch = part.match(/([\d.]+)%\s*$/)
    const colorStr = posMatch ? part.slice(0, part.length - posMatch[0].length).trim() : part
    const position = posMatch ? Number(posMatch[1]) / 100 : i === startIdx ? 0 : i === parts.length - 1 ? 1 : (i - startIdx) / (parts.length - startIdx - 1)

    stops.push({
      color: cssToHex(colorStr),
      alpha: cssToAlpha(colorStr),
      position,
    })
  }

  return { mode, angle, stops }
}

function serializeGradient(mode: FillMode, angle: number, stops: GradientStop[]): string {
  const stopStr = stops
    .map(s => `${hexAlphaToRgba(s.color, s.alpha)} ${Math.round(s.position * 100)}%`)
    .join(', ')
  if (mode === 'radial') return `radial-gradient(circle, ${stopStr})`
  return `linear-gradient(${Math.round(angle)}deg, ${stopStr})`
}

const parsed = computed(() => parseGradient(props.modelValue))

const fillMode = computed<FillMode>(() => {
  if (parsed.value) return parsed.value.mode
  return 'solid'
})

const gradientAngle = computed(() => parsed.value?.angle ?? 180)

const gradientStops = computed<GradientStop[]>(() => {
  if (parsed.value) return parsed.value.stops
  return []
})

const activeColor = computed(() => {
  if (fillMode.value !== 'solid' && gradientStops.value.length) {
    const idx = Math.min(activeStopIndex.value, gradientStops.value.length - 1)
    return gradientStops.value[idx].color
  }
  return cssToHex(props.modelValue)
})

const activeAlpha = computed(() => {
  if (fillMode.value !== 'solid' && gradientStops.value.length) {
    const idx = Math.min(activeStopIndex.value, gradientStops.value.length - 1)
    return gradientStops.value[idx].alpha
  }
  return cssToAlpha(props.modelValue)
})

const hexWithAlpha = computed(() => {
  const hex = activeColor.value
  const a = activeAlpha.value
  if (a < 1) {
    const aa = Math.round(a * 255).toString(16).padStart(2, '0')
    return `${hex}${aa}`
  }
  return hex
})

const rekaColor = computed(() => normalizeColor(hexWithAlpha.value))

function emitSolid(hex: string, alpha: number) {
  emit('update:modelValue', hexAlphaToRgba(hex, alpha) === hex ? hex : hexAlphaToRgba(hex, alpha))
}

function emitGradient(stops: GradientStop[], angle?: number, mode?: FillMode) {
  emit('update:modelValue', serializeGradient(mode ?? fillMode.value, angle ?? gradientAngle.value, stops))
}

function onRekaColorUpdate(c: RekaColor) {
  const hex = colorToHex(c)
  const rgb = convertToRgb(c)
  const alpha = rgb.alpha

  if (fillMode.value !== 'solid' && gradientStops.value.length) {
    const stops = [...gradientStops.value]
    const idx = Math.min(activeStopIndex.value, stops.length - 1)
    stops[idx] = { ...stops[idx], color: hex, alpha }
    emitGradient(stops)
  } else {
    emitSolid(hex, alpha)
  }
}

function onHexUpdate(hex: string) {
  const normalized = normalizeColor(hex)
  const rgb = convertToRgb(normalized)
  const resolvedHex = colorToHex(normalized)
  const alpha = rgb.alpha

  if (fillMode.value !== 'solid' && gradientStops.value.length) {
    const stops = [...gradientStops.value]
    const idx = Math.min(activeStopIndex.value, stops.length - 1)
    stops[idx] = { ...stops[idx], color: resolvedHex, alpha }
    emitGradient(stops)
  } else {
    emitSolid(resolvedHex, alpha)
  }
}

function setMode(mode: FillMode) {
  if (mode === fillMode.value) return
  if (mode === 'solid') {
    const hex = gradientStops.value.length ? gradientStops.value[0].color : cssToHex(props.modelValue)
    const alpha = gradientStops.value.length ? gradientStops.value[0].alpha : cssToAlpha(props.modelValue)
    emitSolid(hex, alpha)
  } else {
    const hex = cssToHex(props.modelValue)
    const alpha = cssToAlpha(props.modelValue)
    const stops: GradientStop[] = [
      { color: hex, alpha, position: 0 },
      { color: '#ffffff', alpha: 1, position: 1 },
    ]
    emitGradient(stops, 180, mode)
    activeStopIndex.value = 0
  }
}

function setAngle(angle: number) {
  if (fillMode.value === 'solid') return
  emitGradient(gradientStops.value, angle)
}

function addStop() {
  const stops = [...gradientStops.value]
  const newPos = stops.length >= 2
    ? (stops[stops.length - 2].position + stops[stops.length - 1].position) / 2
    : 0.5
  stops.push({ color: activeColor.value, alpha: activeAlpha.value, position: newPos })
  stops.sort((a, b) => a.position - b.position)
  activeStopIndex.value = stops.findIndex(s => s.position === newPos)
  emitGradient(stops)
}

function removeStop(index: number) {
  if (gradientStops.value.length <= 2) return
  const stops = gradientStops.value.filter((_, i) => i !== index)
  activeStopIndex.value = Math.min(activeStopIndex.value, stops.length - 1)
  emitGradient(stops)
}

function updateStopPosition(index: number, pos: number) {
  const stops = [...gradientStops.value]
  stops[index] = { ...stops[index], position: Math.max(0, Math.min(1, pos / 100)) }
  emitGradient(stops)
}

const swatchStyle = computed(() => {
  const v = props.modelValue
  if (!v) return { background: 'repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 50% / 8px 8px' }
  return { background: v }
})

const gradientBarBackground = computed(() => {
  if (!gradientStops.value.length) return ''
  const stops = gradientStops.value
    .map(s => `${hexAlphaToRgba(s.color, s.alpha)} ${Math.round(s.position * 100)}%`)
    .join(', ')
  return `linear-gradient(to right, ${stops})`
})

const gradientStopBarRef = ref<HTMLDivElement | null>(null)
const draggingStopIndex = ref<number | null>(null)

function onStopPointerDown(index: number, e: PointerEvent) {
  activeStopIndex.value = index
  draggingStopIndex.value = index
  gradientStopBarRef.value?.setPointerCapture(e.pointerId)
}

function onStopBarPointerMove(e: PointerEvent) {
  const el = gradientStopBarRef.value
  if (!el || draggingStopIndex.value === null || !el.hasPointerCapture(e.pointerId)) return
  const rect = el.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const stops = [...gradientStops.value]
  stops[draggingStopIndex.value] = { ...stops[draggingStopIndex.value], position: pos }
  emitGradient(stops)
}

function onStopBarPointerUp() {
  draggingStopIndex.value = null
}

watch(() => props.modelValue, () => {
  if (fillMode.value !== 'solid' && activeStopIndex.value >= gradientStops.value.length) {
    activeStopIndex.value = Math.max(0, gradientStops.value.length - 1)
  }
})
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <button
        class="size-5 shrink-0 cursor-pointer rounded border border-[#45475a] p-0"
        :style="swatchStyle"
      />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        class="z-[100] w-60 rounded-lg border border-[#45475a] bg-[#1e1e2e] p-2 shadow-xl"
        :side-offset="4"
        side="left"
      >
        <!-- Mode tabs: Solid | Linear | Radial -->
        <div class="mb-2 flex items-center gap-0.5">
          <button
            class="flex size-6 cursor-pointer items-center justify-center rounded border-none p-0 text-[#a6adc8] transition-colors hover:bg-[#45475a] hover:text-[#cdd6f4]"
            :class="{ 'bg-[#45475a] text-[#cdd6f4]': fillMode === 'solid' }"
            title="Solid"
            @click="setMode('solid')"
          >
            <svg class="size-3.5" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" /></svg>
          </button>
          <button
            class="flex size-6 cursor-pointer items-center justify-center rounded border-none p-0 text-[#a6adc8] transition-colors hover:bg-[#45475a] hover:text-[#cdd6f4]"
            :class="{ 'bg-[#45475a] text-[#cdd6f4]': fillMode === 'linear' }"
            title="Linear Gradient"
            @click="setMode('linear')"
          >
            <svg class="size-3.5" viewBox="0 0 16 16">
              <defs><linearGradient id="gl"><stop offset="0" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs>
              <rect x="2" y="2" width="12" height="12" rx="2" fill="url(#gl)" />
            </svg>
          </button>
          <button
            class="flex size-6 cursor-pointer items-center justify-center rounded border-none p-0 text-[#a6adc8] transition-colors hover:bg-[#45475a] hover:text-[#cdd6f4]"
            :class="{ 'bg-[#45475a] text-[#cdd6f4]': fillMode === 'radial' }"
            title="Radial Gradient"
            @click="setMode('radial')"
          >
            <svg class="size-3.5" viewBox="0 0 16 16">
              <defs><radialGradient id="gr"><stop offset="0" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></radialGradient></defs>
              <rect x="2" y="2" width="12" height="12" rx="2" fill="url(#gr)" />
            </svg>
          </button>
        </div>

        <!-- Gradient angle (linear only) -->
        <div v-if="fillMode === 'linear'" class="mb-2">
          <ScrubInput
            icon="°"
            :model-value="gradientAngle"
            :min="0"
            :max="360"
            suffix="deg"
            @update:model-value="setAngle($event)"
          />
        </div>

        <!-- Gradient stop bar -->
        <div
          v-if="fillMode !== 'solid' && gradientStops.length"
          ref="gradientStopBarRef"
          class="relative mb-2 h-6 rounded"
          :style="{ background: gradientBarBackground }"
          @pointermove="onStopBarPointerMove"
          @pointerup="onStopBarPointerUp"
        >
          <div
            v-for="(stop, idx) in gradientStops"
            :key="idx"
            class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm border-2 shadow-sm"
            :class="idx === activeStopIndex ? 'border-white' : 'border-white/60'"
            :style="{ left: `${stop.position * 100}%`, background: hexAlphaToRgba(stop.color, stop.alpha) }"
            @pointerdown.stop="onStopPointerDown(idx, $event)"
          />
        </div>

        <!-- Gradient stops list -->
        <div v-if="fillMode !== 'solid' && gradientStops.length" class="mb-2">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-[11px] text-[#a6adc8]">Stops</span>
            <button
              class="flex size-4 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#a6adc8] hover:text-[#cdd6f4]"
              title="Add stop"
              @click="addStop"
            >+</button>
          </div>
          <div
            v-for="(stop, idx) in gradientStops"
            :key="idx"
            class="flex items-center gap-1 py-0.5"
            :class="{ 'rounded bg-[#45475a]/50': idx === activeStopIndex }"
            @click="activeStopIndex = idx"
          >
            <ScrubInput
              class="w-11"
              suffix="%"
              :model-value="Math.round(stop.position * 100)"
              :min="0"
              :max="100"
              @update:model-value="updateStopPosition(idx, $event)"
              @click.stop
            />
            <button
              class="size-4 shrink-0 cursor-pointer rounded border border-[#45475a] p-0"
              :style="{ background: hexAlphaToRgba(stop.color, stop.alpha) }"
              @click.stop="activeStopIndex = idx"
            />
            <input
              class="min-w-0 flex-1 rounded border border-[#45475a] bg-[#313244] px-1 py-0.5 font-mono text-[11px] text-[#cdd6f4]"
              :value="stop.color.slice(1)"
              maxlength="6"
              @change="
                (() => {
                  const v = ($event.target as HTMLInputElement).value
                  const hex = v.startsWith('#') ? v : `#${v}`
                  const stops = [...gradientStops]
                  stops[idx] = { ...stops[idx], color: cssToHex(hex) }
                  emitGradient(stops)
                })()
              "
              @click.stop
            />
            <button
              v-if="gradientStops.length > 2"
              class="flex size-4 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#a6adc8] hover:text-[#cdd6f4]"
              @click.stop="removeStop(idx)"
            >−</button>
          </div>
        </div>

        <!-- HSV color area -->
        <div class="flex flex-col gap-2">
          <ColorAreaRoot
            v-slot="{ style }"
            :model-value="rekaColor"
            color-space="hsb"
            x-channel="saturation"
            y-channel="brightness"
            @update:color="onRekaColorUpdate"
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
            @update:color="onRekaColorUpdate"
          >
            <ColorSliderTrack class="h-full w-full rounded-md" />
            <ColorSliderThumb class="absolute size-3.5 cursor-pointer rounded-full border-2 border-white shadow-sm" />
          </ColorSliderRoot>

          <div class="checkerboard relative h-3 w-full rounded-md">
            <ColorSliderRoot
              :model-value="rekaColor"
              channel="alpha"
              color-space="hsb"
              class="absolute inset-0 flex items-center"
              @update:color="onRekaColorUpdate"
            >
              <ColorSliderTrack class="h-full w-full rounded-md" />
              <ColorSliderThumb class="absolute size-3.5 cursor-pointer rounded-full border-2 border-white shadow-sm" />
            </ColorSliderRoot>
          </div>

          <div class="flex items-center gap-1">
            <span class="text-[11px] text-[#a6adc8]">#</span>
            <ColorFieldRoot :model-value="hexWithAlpha" class="min-w-0 flex-1" @update:model-value="onHexUpdate">
              <ColorFieldInput class="w-full rounded border border-[#45475a] bg-[#313244] px-1.5 py-0.5 font-mono text-xs text-[#cdd6f4]" />
            </ColorFieldRoot>
            <ScrubInput
              class="w-12"
              suffix="%"
              :model-value="Math.round(activeAlpha * 100)"
              :min="0"
              :max="100"
              @update:model-value="
                (() => {
                  const a = $event / 100
                  if (fillMode !== 'solid' && gradientStops.length) {
                    const stops = [...gradientStops]
                    const idx = Math.min(activeStopIndex, stops.length - 1)
                    stops[idx] = { ...stops[idx], alpha: a }
                    emitGradient(stops)
                  } else {
                    emitSolid(activeColor, a)
                  }
                })()
              "
            />
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
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
  background-color: #333;
}
</style>
