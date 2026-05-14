<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DesignNode } from '@/model/types'
import { bindableValues, bindingSourceId } from '@/model/bindings'
import { useDocumentStore } from '@/model/document'
import SectionHeader from './SectionHeader.vue'

const props = defineProps<{
  node: DesignNode
}>()

const store = useDocumentStore()

const values = computed(() => bindableValues(store.capabilities, store.frames))
const textTarget = computed(() => ({ kind: 'text' as const, nodeId: props.node.id }))
const textBinding = computed(() => store.bindingForTarget(textTarget.value))
const selectedTextSource = computed(() => textBinding.value ? bindingSourceId(textBinding.value.source) : '')
const textBindingExpression = computed(() => values.value.find((value) => value.id === selectedTextSource.value)?.expression ?? '')
const textBindingPreview = computed(() => `{{ ${textBinding.value?.transform?.expression || textBindingExpression.value} }}`)

const styleProperty = ref('opacity')
const propName = ref('title')
const showTextAdvanced = ref(false)
const showStyleAdvanced = ref(false)
const showPropAdvanced = ref(false)
const showDeveloperBindings = ref(false)

watch(
  () => props.node.id,
  () => {
    const existingStyle = store.bindingsForNode(props.node.id).find((binding) => binding.target.kind === 'style')
    const existingProp = store.bindingsForNode(props.node.id).find((binding) => binding.target.kind === 'prop')
    styleProperty.value = existingStyle?.target.kind === 'style' ? existingStyle.target.property : 'opacity'
    propName.value = existingProp?.target.kind === 'prop' ? existingProp.target.prop : 'title'
    showTextAdvanced.value = false
    showStyleAdvanced.value = false
    showPropAdvanced.value = false
    showDeveloperBindings.value = false
  },
  { immediate: true },
)

const styleTarget = computed(() => ({ kind: 'style' as const, nodeId: props.node.id, property: styleProperty.value }))
const styleBinding = computed(() => store.bindingForTarget(styleTarget.value))
const selectedStyleSource = computed(() => styleBinding.value ? bindingSourceId(styleBinding.value.source) : '')
const styleBindingExpression = computed(() => values.value.find((value) => value.id === selectedStyleSource.value)?.expression ?? '')
const styleBindingPreview = computed(() => `${styleProperty.value}: ${styleBinding.value?.transform?.expression || styleBindingExpression.value}`)

const propTarget = computed(() => ({ kind: 'prop' as const, nodeId: props.node.id, prop: propName.value }))
const propBinding = computed(() => store.bindingForTarget(propTarget.value))
const selectedPropSource = computed(() => propBinding.value ? bindingSourceId(propBinding.value.source) : '')
const propBindingExpression = computed(() => values.value.find((value) => value.id === selectedPropSource.value)?.expression ?? '')
const propBindingPreview = computed(() => `${propName.value}=\"${propBinding.value?.transform?.expression || propBindingExpression.value}\"`)

function bindText(sourceId: string) {
  if (!sourceId) {
    if (textBinding.value) {
      store.recordHistory()
      store.removeBinding(textBinding.value.id)
    }
    return
  }

  const value = values.value.find((candidate) => candidate.id === sourceId)
  if (!value) return
  store.recordHistory()
  store.addBinding(textTarget.value, value.source)
}

function bindStyle(sourceId: string) {
  if (!sourceId) {
    if (styleBinding.value) {
      store.recordHistory()
      store.removeBinding(styleBinding.value.id)
    }
    return
  }

  const value = values.value.find((candidate) => candidate.id === sourceId)
  if (!value) return
  store.recordHistory()
  store.addBinding(styleTarget.value, value.source)
}

function bindProp(sourceId: string) {
  if (!sourceId) {
    if (propBinding.value) {
      store.recordHistory()
      store.removeBinding(propBinding.value.id)
    }
    return
  }

  const value = values.value.find((candidate) => candidate.id === sourceId)
  if (!value) return
  store.recordHistory()
  store.addBinding(propTarget.value, value.source)
}

function updateTextTransform(expression: string) {
  if (!textBinding.value) return
  store.recordHistory()
  textBinding.value.transform = expression ? { expression } : undefined
}

function updateStyleTransform(expression: string) {
  if (!styleBinding.value) return
  store.recordHistory()
  styleBinding.value.transform = expression ? { expression } : undefined
}

function updatePropTransform(expression: string) {
  if (!propBinding.value) return
  store.recordHistory()
  propBinding.value.transform = expression ? { expression } : undefined
}
</script>

<template>
  <div class="border-b border-[#313244] px-4 py-3">
    <SectionHeader title="Dynamic data" />

    <div v-if="values.length > 0" class="space-y-4">
      <div class="space-y-1.5">
        <label class="block text-[10px] font-medium uppercase tracking-wide text-[#6c7086]">
          Content
        </label>
        <select
          class="w-full rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
          :value="selectedTextSource"
          @change="bindText(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Static text</option>
          <option
            v-for="value in values"
            :key="value.id"
            :value="value.id"
          >
            {{ value.label }}
          </option>
        </select>

        <button
          v-if="textBinding"
          class="text-[10px] text-[#89b4fa] hover:text-[#b4befe]"
          @click="showTextAdvanced = !showTextAdvanced"
        >
          {{ showTextAdvanced ? 'Hide' : 'Show' }} generated expression
        </button>

        <div v-if="textBinding && showTextAdvanced" class="space-y-1.5">
          <input
            class="w-full rounded border border-[#45475a] bg-[#181825] px-2 py-1 font-mono text-[11px] text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
            :value="textBinding.transform?.expression ?? ''"
            placeholder="Optional transform, e.g. Math.round(value)"
            @input="updateTextTransform(($event.target as HTMLInputElement).value)"
          />
          <div class="rounded bg-[#181825] px-2 py-1 text-[10px] text-[#a6adc8]">
            <span class="font-mono text-[#94e2d5]">{{ textBindingPreview }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-[10px] font-medium uppercase tracking-wide text-[#6c7086]">
          Dynamic appearance
        </label>
        <div class="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-1.5">
          <input
            v-model="styleProperty"
            class="rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 font-mono text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
            placeholder="opacity"
          />
          <select
            class="rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
            :value="selectedStyleSource"
            @change="bindStyle(($event.target as HTMLSelectElement).value)"
          >
            <option value="">Static value</option>
            <option
              v-for="value in values"
              :key="value.id"
              :value="value.id"
            >
              {{ value.label }}
            </option>
          </select>
        </div>

        <button
          v-if="styleBinding"
          class="text-[10px] text-[#89b4fa] hover:text-[#b4befe]"
          @click="showStyleAdvanced = !showStyleAdvanced"
        >
          {{ showStyleAdvanced ? 'Hide' : 'Show' }} generated style
        </button>

        <div v-if="styleBinding && showStyleAdvanced" class="space-y-1.5">
          <input
            class="w-full rounded border border-[#45475a] bg-[#181825] px-2 py-1 font-mono text-[11px] text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
            :value="styleBinding.transform?.expression ?? ''"
            placeholder="Optional transform, e.g. isDark ? '1' : '0.4'"
            @input="updateStyleTransform(($event.target as HTMLInputElement).value)"
          />
          <div class="rounded bg-[#181825] px-2 py-1 text-[10px] text-[#a6adc8]">
            <span class="font-mono text-[#94e2d5]">{{ styleBindingPreview }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1.5">
        <button
          class="text-[10px] font-medium uppercase tracking-wide text-[#6c7086] hover:text-[#cdd6f4]"
          @click="showDeveloperBindings = !showDeveloperBindings"
        >
          {{ showDeveloperBindings ? '▾' : '▸' }} Developer bindings
        </button>

        <div v-if="showDeveloperBindings" class="space-y-1.5">
          <div class="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-1.5">
            <input
              v-model="propName"
              class="rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 font-mono text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
              placeholder="title, disabled, v-model"
            />
            <select
              class="rounded-md border border-[#45475a] bg-[#181825] px-2 py-1.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
              :value="selectedPropSource"
              @change="bindProp(($event.target as HTMLSelectElement).value)"
            >
              <option value="">No binding</option>
              <option
                v-for="value in values"
                :key="value.id"
                :value="value.id"
              >
                {{ value.label }}
              </option>
            </select>
          </div>

          <button
            v-if="propBinding"
            class="text-[10px] text-[#89b4fa] hover:text-[#b4befe]"
            @click="showPropAdvanced = !showPropAdvanced"
          >
            {{ showPropAdvanced ? 'Hide' : 'Show' }} generated prop
          </button>

          <div v-if="propBinding && showPropAdvanced" class="space-y-1.5">
            <input
              class="w-full rounded border border-[#45475a] bg-[#181825] px-2 py-1 font-mono text-[11px] text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
              :value="propBinding.transform?.expression ?? ''"
              placeholder="Optional transform"
              @input="updatePropTransform(($event.target as HTMLInputElement).value)"
            />
            <div class="rounded bg-[#181825] px-2 py-1 text-[10px] text-[#a6adc8]">
              <span class="font-mono text-[#94e2d5]">{{ propBindingPreview }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-[11px] text-[#6c7086]">
      Add a capability first to expose dynamic values.
    </div>
  </div>
</template>
