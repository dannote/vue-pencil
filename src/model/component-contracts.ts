import type { BindingTarget, CapabilityValueType, DesignNode } from './types'

export interface ComponentPropertyContract {
  id: string
  label: string
  description: string
  targetProp: string
  accepts: CapabilityValueType[]
}

export interface ComponentContract {
  type: string
  label: string
  library: string
  properties: ComponentPropertyContract[]
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
  },
]

export function getComponentContract(node: DesignNode): ComponentContract | undefined {
  return COMPONENT_CONTRACTS.find((contract) => contract.type === node.type)
}

export function componentPropertyTarget(node: DesignNode, property: ComponentPropertyContract): BindingTarget {
  return { kind: 'prop', nodeId: node.id, prop: property.targetProp }
}
