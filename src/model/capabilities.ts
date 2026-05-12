import type { CapabilityInstance, CapabilityOutputInstance, CapabilityValueType } from './types'

export interface CapabilityOutputDefinition {
  name: string
  label: string
  type: CapabilityValueType
  writable: boolean
  defaultLocalName: string
}

export interface CapabilityActionDefinition {
  name: string
  label: string
  defaultLocalName: string
}

export interface CapabilityDefinition {
  id: string
  label: string
  description: string
  category: 'state' | 'element' | 'browser'
  scope: 'component' | 'element'
  composables: string[]
  outputs: CapabilityOutputDefinition[]
  actions: CapabilityActionDefinition[]
  defaultOptions?: Record<string, unknown>
  vaporCompatibility: 'server-only-no' | 'hybrid-client-only'
}

export const CAPABILITY_DEFINITIONS: CapabilityDefinition[] = [
  {
    id: 'theme.dark-mode',
    label: 'Dark mode',
    description: 'Expose a writable boolean connected to the user\'s dark-mode preference.',
    category: 'browser',
    scope: 'component',
    composables: ['useDark'],
    outputs: [
      { name: 'value', label: 'Dark mode enabled', type: 'boolean', writable: true, defaultLocalName: 'isDark' },
    ],
    actions: [],
    vaporCompatibility: 'hybrid-client-only',
  },
  {
    id: 'state.local-storage',
    label: 'Persist value',
    description: 'Create a writable value that is saved in browser local storage.',
    category: 'state',
    scope: 'component',
    composables: ['useLocalStorage'],
    outputs: [
      { name: 'value', label: 'Stored value', type: 'string', writable: true, defaultLocalName: 'storedValue' },
    ],
    actions: [],
    defaultOptions: { key: 'vue-pencil-value', initialValue: '' },
    vaporCompatibility: 'hybrid-client-only',
  },
  {
    id: 'element.size',
    label: 'Track size',
    description: 'Expose the selected element\'s rendered width and height.',
    category: 'element',
    scope: 'element',
    composables: ['useElementSize'],
    outputs: [
      { name: 'width', label: 'Element width', type: 'number', writable: false, defaultLocalName: 'elementWidth' },
      { name: 'height', label: 'Element height', type: 'number', writable: false, defaultLocalName: 'elementHeight' },
    ],
    actions: [],
    vaporCompatibility: 'hybrid-client-only',
  },
  {
    id: 'element.draggable',
    label: 'Make draggable',
    description: 'Let the selected element be dragged in preview/runtime.',
    category: 'element',
    scope: 'element',
    composables: ['useDraggable'],
    outputs: [
      { name: 'x', label: 'Drag X', type: 'number', writable: false, defaultLocalName: 'dragX' },
      { name: 'y', label: 'Drag Y', type: 'number', writable: false, defaultLocalName: 'dragY' },
      { name: 'style', label: 'Drag style', type: 'style', writable: false, defaultLocalName: 'dragStyle' },
    ],
    actions: [],
    vaporCompatibility: 'hybrid-client-only',
  },
]

export function getCapabilityDefinition(id: string): CapabilityDefinition | undefined {
  return CAPABILITY_DEFINITIONS.find((definition) => definition.id === id)
}

export function createCapabilityInstance(definitionId: string, targetNodeId?: string): CapabilityInstance {
  const definition = getCapabilityDefinition(definitionId)
  if (!definition) throw new Error(`Unknown capability: ${definitionId}`)

  return {
    id: `cap_${crypto.randomUUID().slice(0, 8)}`,
    definitionId,
    targetNodeId,
    options: { ...definition.defaultOptions },
    outputs: definition.outputs.map((output) => createOutputInstance(output, targetNodeId)),
    actions: definition.actions.map((action) => ({
      id: `action_${crypto.randomUUID().slice(0, 8)}`,
      name: action.name,
      label: action.label,
      localName: action.defaultLocalName,
    })),
  }
}

function createOutputInstance(output: CapabilityOutputDefinition, targetNodeId?: string): CapabilityOutputInstance {
  const suffix = targetNodeId ? pascalize(targetNodeId.slice(0, 4)) : ''

  return {
    id: `out_${crypto.randomUUID().slice(0, 8)}`,
    name: output.name,
    label: output.label,
    localName: suffix ? `${output.defaultLocalName}${suffix}` : output.defaultLocalName,
    type: output.type,
    writable: output.writable,
  }
}

function pascalize(value: string): string {
  return value.replace(/(^|[-_\s]+)(\w)/g, (_, _separator: string, letter: string) => letter.toUpperCase())
}
