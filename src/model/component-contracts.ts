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
]

export function getComponentContract(node: DesignNode): ComponentContract | undefined {
  return COMPONENT_CONTRACTS.find((contract) => contract.type === node.type)
}

export function componentPropertyTarget(node: DesignNode, property: ComponentPropertyContract): BindingTarget {
  return { kind: 'prop', nodeId: node.id, prop: property.targetProp }
}

export function componentPartNodes(root: DesignNode, contract: ComponentContract): ComponentPartNode[] {
  return contract.parts.flatMap((part) => {
    const node = findPartNode(root, part)
    return node ? [{ contract: part, node }] : []
  })
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
