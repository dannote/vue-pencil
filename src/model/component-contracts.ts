import type { BindingTarget, CapabilityValueType, DesignNode } from './types'

export interface ComponentPropertyContract {
  id: string
  label: string
  description: string
  targetProp: string
  accepts: CapabilityValueType[]
}

export interface ComponentPartContract {
  id: string
  label: string
  nodeType: string
  part: string
}

export interface ComponentPartNode {
  contract: ComponentPartContract
  node: DesignNode
}

export interface ComponentSlotNode {
  node: DesignNode
  name: string
  label: string
}

export interface ComponentContract {
  type: string
  label: string
  library: string
  properties: ComponentPropertyContract[]
  parts: ComponentPartContract[]
}

export const COMPONENT_CONTRACTS: ComponentContract[] = [
  {
    type: 'SwitchRoot',
    label: 'Switch',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Value',
        description: 'The on/off state controlled by this switch.',
        targetProp: 'v-model',
        accepts: ['boolean'],
      },
      {
        id: 'disabled',
        label: 'Disabled',
        description: 'Prevent interaction with this switch.',
        targetProp: 'disabled',
        accepts: ['boolean'],
      },
    ],
    parts: [
      { id: 'track', label: 'Track', nodeType: 'SwitchRoot', part: 'root' },
      { id: 'thumb', label: 'Thumb', nodeType: 'SwitchThumb', part: 'thumb' },
    ],
  },
  {
    type: 'CheckboxRoot',
    label: 'Checkbox',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Checked',
        description: 'The checked state controlled by this checkbox.',
        targetProp: 'v-model',
        accepts: ['boolean'],
      },
      {
        id: 'disabled',
        label: 'Disabled',
        description: 'Prevent interaction with this checkbox.',
        targetProp: 'disabled',
        accepts: ['boolean'],
      },
    ],
    parts: [
      { id: 'box', label: 'Box', nodeType: 'CheckboxRoot', part: 'root' },
      { id: 'indicator', label: 'Indicator', nodeType: 'CheckboxIndicator', part: 'indicator' },
    ],
  },
  {
    type: 'SliderRoot',
    label: 'Slider',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Value',
        description: 'The numeric value controlled by this slider.',
        targetProp: 'v-model',
        accepts: ['number'],
      },
      {
        id: 'disabled',
        label: 'Disabled',
        description: 'Prevent interaction with this slider.',
        targetProp: 'disabled',
        accepts: ['boolean'],
      },
    ],
    parts: [
      { id: 'track', label: 'Track', nodeType: 'SliderTrack', part: 'track' },
      { id: 'range', label: 'Range', nodeType: 'SliderRange', part: 'range' },
      { id: 'thumb', label: 'Thumb', nodeType: 'SliderThumb', part: 'thumb' },
    ],
  },
  {
    type: 'ProgressRoot',
    label: 'Progress',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Value',
        description: 'The current progress value.',
        targetProp: 'modelValue',
        accepts: ['number'],
      },
    ],
    parts: [
      { id: 'track', label: 'Track', nodeType: 'ProgressRoot', part: 'root' },
      { id: 'indicator', label: 'Indicator', nodeType: 'ProgressIndicator', part: 'indicator' },
    ],
  },
  {
    type: 'TabsRoot',
    label: 'Tabs',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Active tab',
        description: 'The selected tab value.',
        targetProp: 'v-model',
        accepts: ['string'],
      },
    ],
    parts: [
      { id: 'list', label: 'List', nodeType: 'TabsList', part: 'list' },
      { id: 'trigger', label: 'Trigger', nodeType: 'TabsTrigger', part: 'trigger' },
      { id: 'content', label: 'Content', nodeType: 'TabsContent', part: 'content' },
    ],
  },
  {
    type: 'AccordionRoot',
    label: 'Accordion',
    library: 'reka-ui',
    properties: [
      {
        id: 'value',
        label: 'Open item',
        description: 'The currently open accordion item.',
        targetProp: 'v-model',
        accepts: ['string'],
      },
    ],
    parts: [
      { id: 'item', label: 'Item', nodeType: 'AccordionItem', part: 'item' },
      { id: 'header', label: 'Header', nodeType: 'AccordionHeader', part: 'header' },
      { id: 'trigger', label: 'Trigger', nodeType: 'AccordionTrigger', part: 'trigger' },
      { id: 'content', label: 'Content', nodeType: 'AccordionContent', part: 'content' },
    ],
  },
  {
    type: 'CollapsibleRoot',
    label: 'Collapsible',
    library: 'reka-ui',
    properties: [
      {
        id: 'open',
        label: 'Open',
        description: 'Whether the collapsible content is open.',
        targetProp: 'v-model:open',
        accepts: ['boolean'],
      },
    ],
    parts: [
      { id: 'trigger', label: 'Trigger', nodeType: 'CollapsibleTrigger', part: 'trigger' },
      { id: 'content', label: 'Content', nodeType: 'CollapsibleContent', part: 'content' },
    ],
  },
]

export function getComponentContract(node: DesignNode): ComponentContract | undefined {
  return COMPONENT_CONTRACTS.find((contract) => contract.type === node.type)
}

export function componentPropertyTarget(node: DesignNode, property: ComponentPropertyContract): BindingTarget {
  return { kind: 'prop', nodeId: node.id, prop: property.targetProp }
}

export function componentSlotNodes(root: DesignNode): ComponentSlotNode[] {
  const slots: ComponentSlotNode[] = []
  collectSlotNodes(root, slots)
  return slots
}

export function componentPartNodes(root: DesignNode, contract: ComponentContract): ComponentPartNode[] {
  return contract.parts.flatMap((part) => {
    const node = findPartNode(root, part)
    return node ? [{ contract: part, node }] : []
  })
}

function collectSlotNodes(node: DesignNode, slots: ComponentSlotNode[]): void {
  if (node.meta.slot) {
    slots.push({ node, name: node.meta.slot.name, label: node.meta.slot.label })
  }

  for (const child of node.children) {
    if (typeof child !== 'string') collectSlotNodes(child, slots)
  }
}

function findPartNode(node: DesignNode, part: ComponentPartContract): DesignNode | undefined {
  if (node.type === part.nodeType && node.meta.source?.kind === 'library' && node.meta.source.part === part.part) {
    return node
  }

  for (const child of node.children) {
    if (typeof child === 'string') continue
    const found = findPartNode(child, part)
    if (found) return found
  }

  return undefined
}
