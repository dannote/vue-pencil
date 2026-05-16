<script setup lang="ts">
import { computed, ref, onMounted, provide } from 'vue'
import { useDocumentStore } from '@/model/document'
import { documentToVueSfc } from '@/model/serialize'
import Toolbar from './Toolbar.vue'
import LayerPanel from './LayerPanel.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import Canvas from './Canvas.vue'
import CommandPalette, { type CommandItem } from './CommandPalette.vue'
import ToastHost, { type ToastMessage } from './ToastHost.vue'

const store = useDocumentStore()
const canvasRef = ref<InstanceType<typeof Canvas>>()
const activeTool = ref('select')
const preview = ref(false)
const zoom = ref(1)
const commandPaletteOpen = ref(false)
const toasts = ref<ToastMessage[]>([])

provide('preview', preview)
provide('activeTool', activeTool)

function onTool(name: string) {
  activeTool.value = name
}

function showToast(text: string) {
  const id = crypto.randomUUID()
  toasts.value.push({ id, text })
  window.setTimeout(() => {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }, 2200)
}

function selectedNodeId(): string | undefined {
  return [...store.selectedIds][0]
}

function createDocumentRoot() {
  return {
    id: 'export-root',
    type: 'div',
    props: { style: { position: 'relative' } },
    children: store.frames,
    meta: { name: 'VuePencil Document' },
  }
}

async function copyVueSfc() {
  try {
    const source = documentToVueSfc({ root: createDocumentRoot(), capabilities: store.capabilities, bindings: store.bindings })
    await navigator.clipboard.writeText(source)
    showToast('Vue SFC copied')
  } catch {
    showToast('Could not copy Vue SFC')
  }
}

const commands = computed<CommandItem[]>(() => {
  const hasSelection = store.selectedIds.size > 0
  return [
    {
      id: 'toggle-preview',
      title: preview.value ? 'Exit Preview' : 'Enter Preview',
      description: 'Toggle interactive preview mode',
      shortcut: '⌘⇧P',
      run: () => {
        preview.value = !preview.value
        showToast(preview.value ? 'Preview mode' : 'Edit mode')
      },
    },
    {
      id: 'create-component',
      title: 'Create Component',
      description: 'Save the selected node as a local asset',
      disabled: !hasSelection,
      run: () => {
        const id = selectedNodeId()
        if (!id) return
        store.recordHistory()
        const component = store.createComponentFromNode(id)
        showToast(component ? `Component ${component.name} created` : 'Could not create component')
      },
    },
    {
      id: 'duplicate-selection',
      title: 'Duplicate Selection',
      description: 'Duplicate selected layers',
      shortcut: '⌘D',
      disabled: !hasSelection,
      run: () => {
        store.duplicateSelection()
        showToast('Selection duplicated')
      },
    },
    {
      id: 'delete-selection',
      title: 'Delete Selection',
      description: 'Remove selected layers',
      shortcut: '⌫',
      disabled: !hasSelection,
      run: () => {
        store.deleteSelection()
        showToast('Selection deleted')
      },
    },
    {
      id: 'toggle-auto-layout',
      title: 'Toggle Auto Layout',
      description: 'Wrap selected node children in flex layout',
      shortcut: '⇧A',
      disabled: store.selectedIds.size !== 1,
      run: () => {
        showToast(store.toggleAutoLayoutForSelection() ? 'Auto layout toggled' : 'Select one layer first')
      },
    },
    {
      id: 'insert-reka-switch',
      title: 'Insert Reka Switch',
      description: 'Add a semantic Switch component instance',
      run: () => {
        store.insertLibraryComponent('reka-switch')
        showToast('Switch inserted')
      },
    },
    {
      id: 'add-dark-mode',
      title: 'Add Dark Mode Capability',
      description: 'Expose VueUse dark mode as a binding source',
      run: () => {
        store.recordHistory()
        store.addCapability('theme.dark-mode')
        showToast('Dark mode capability added')
      },
    },
    {
      id: 'add-track-size',
      title: 'Add Track Size Capability',
      description: 'Track the selected element size with VueUse',
      disabled: !hasSelection,
      run: () => {
        const id = selectedNodeId()
        if (!id) return
        store.recordHistory()
        store.addCapability('element.size', id)
        showToast('Track size capability added')
      },
    },
    {
      id: 'copy-vue-sfc',
      title: 'Copy Vue SFC',
      description: 'Copy generated Vue single-file component code',
      run: copyVueSfc,
    },
  ]
})

onMounted(() => {
  // --- Card frame with interactive button ---
  const card = store.addFrame(80, 60, 340, 320, {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '28px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  })

  store.addChild(card.id, 'h1', {
    margin: '0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e1e2e',
  }, ['Interactive Card'], undefined, 'Heading')

  store.addChild(card.id, 'p', {
    margin: '0',
    fontSize: '14px',
    color: '#6c7086',
    lineHeight: '1.6',
  }, ['Switch to Preview mode to interact with buttons and hover states.'], undefined, 'Description')

  // Counter display
  store.addChild(card.id, 'div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }, [], undefined, 'Counter Row')

  const counterRow = card.children[card.children.length - 1]
  if (typeof counterRow !== 'string') {
    store.addChild(counterRow.id, 'button', {
      padding: '8px 16px',
      background: '#4361ee',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.15s, transform 0.1s',
    }, ['Count: 0'], undefined, 'Counter Button')

    store.addChild(counterRow.id, 'button', {
      padding: '8px 16px',
      background: '#f38ba8',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.15s, transform 0.1s',
    }, ['Reset'], undefined, 'Reset Button')
  }

  // Toggle switch
  store.addChild(card.id, 'div', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }, [], undefined, 'Toggle Row')

  const toggleRow = card.children[card.children.length - 1]
  if (typeof toggleRow !== 'string') {
    store.addChild(toggleRow.id, 'div', {
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: '#cdd6f4',
      cursor: 'pointer',
      transition: 'background 0.2s',
      position: 'relative',
    }, [], undefined, 'Toggle Track')

    const track = toggleRow.children[toggleRow.children.length - 1]
    if (typeof track !== 'string') {
      store.addChild(track.id, 'div', {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: '2px',
        left: '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }, [], undefined, 'Toggle Knob')
    }

    store.addChild(toggleRow.id, 'span', {
      fontSize: '13px',
      color: '#6c7086',
    }, ['Dark mode'], undefined, 'Toggle Label')
  }

  // --- Gradient frame ---
  const gradient = store.addFrame(500, 60, 300, 200, {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'white',
    fontFamily: '-apple-system, sans-serif',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  })

  store.addChild(gradient.id, 'span', {
    fontSize: '20px',
    fontWeight: '700',
  }, ['Hover Me'], undefined, 'Title')

  store.addChild(gradient.id, 'span', {
    fontSize: '13px',
    opacity: '0.8',
  }, ['I scale up on hover in preview mode'], undefined, 'Subtitle')

  // --- Circle ---
  store.addFrame(500, 300, 140, 140, {
    background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
    borderRadius: '50%',
    boxShadow: '0 8px 24px rgba(255,107,107,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, sans-serif',
    fontSize: '32px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    userSelect: 'none',
  })

  store.addChild(store.frames[2].id, 'span', {}, ['🎨'], undefined, 'Emoji')

  // --- Input frame ---
  const inputFrame = store.addFrame(80, 420, 340, 120, {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '12px',
    fontFamily: '-apple-system, sans-serif',
  })

  store.addChild(inputFrame.id, 'label', {
    fontSize: '13px',
    fontWeight: '600',
    color: '#45475a',
  }, ['Type something in preview mode:'], undefined, 'Input Label')

  const textInput = store.addChild(inputFrame.id, 'input', {
    padding: '8px 12px',
    border: '2px solid #cdd6f4',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }, [], undefined, 'Text Input')
  if (textInput) {
    textInput.props.type = 'text'
    textInput.props.placeholder = 'Hello world...'
  }

  // --- Capability demo ---
  const capabilityFrame = store.addFrame(460, 430, 300, 260, {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '20px',
    background: '#111827',
    color: 'white',
    borderRadius: '18px',
    boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  })

  store.addChild(capabilityFrame.id, 'div', {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    padding: '4px 8px',
    borderRadius: '999px',
    background: 'rgba(148, 226, 213, 0.16)',
    color: '#94e2d5',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }, ['VueUse + Reka'], undefined, 'Badge')

  store.addChild(capabilityFrame.id, 'h2', {
    margin: '0',
    fontSize: '21px',
    lineHeight: '1.1',
    fontWeight: '800',
  }, ['Bound component instance'], undefined, 'Title')

  store.addChild(capabilityFrame.id, 'p', {
    margin: '0',
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: '1.5',
  }, ['This switch is a library component. Its Value property is bound to the Dark mode capability.'], undefined, 'Description')

  const switchRow = store.addChild(capabilityFrame.id, 'div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.08)',
  }, [], undefined, 'Switch Binding Row')

  if (switchRow) {
    store.addChild(switchRow.id, 'span', {
      fontSize: '14px',
      fontWeight: '650',
      color: '#f8fafc',
    }, ['Dark mode'], undefined, 'Switch Label')

    const switchRoot = store.addChild(switchRow.id, 'SwitchRoot', {
      width: '44px',
      height: '24px',
      borderRadius: '999px',
      background: '#cdd6f4',
      border: 'none',
      padding: '2px',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'background 0.2s',
    }, [], undefined, 'Switch')

    if (switchRoot) {
      switchRoot.meta.source = { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'root' }
      switchRoot.props.defaultValue = false
      switchRoot.props.class = 'vp-switch-root'

      const thumb = store.addChild(switchRoot.id, 'SwitchThumb', {
        width: '20px',
        height: '20px',
        borderRadius: '999px',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s',
      }, [], undefined, 'Thumb')
      if (thumb) {
        thumb.props.class = 'vp-switch-thumb'
        thumb.meta.source = { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'thumb' }
      }

      const darkMode = store.addCapability('theme.dark-mode')
      store.addBinding(
        { kind: 'prop', nodeId: switchRoot.id, prop: 'v-model' },
        { kind: 'capability-output', capabilityId: darkMode.id, outputId: darkMode.outputs[0].id },
      )
    }
  }

  const metric = store.addChild(capabilityFrame.id, 'div', {
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(67, 97, 238, 0.22)',
    color: '#bfdbfe',
    fontSize: '13px',
    fontWeight: '700',
  }, ['Width preview'], undefined, 'Width Metric')

  if (metric) {
    const size = store.addCapability('element.size', metric.id)
    store.addBinding(
      { kind: 'text', nodeId: metric.id },
      { kind: 'capability-output', capabilityId: size.id, outputId: size.outputs[0].id },
    )
  }

  store.clearHistory()
})
</script>

<template>
  <Toolbar :zoom="zoom" :active-tool="activeTool" :preview="preview" @tool="onTool" @update:preview="preview = $event" />
  <LayerPanel v-if="!preview" :frames="store.frames" />
  <Canvas ref="canvasRef" />
  <PropertiesPanel v-if="!preview" />
  <CommandPalette v-model:open="commandPaletteOpen" :commands="commands" />
  <ToastHost :messages="toasts" />
</template>
