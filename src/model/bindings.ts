import type { Binding, BindingSource, CapabilityInstance, CapabilityValueType, DesignNode } from './types'
import { findNode } from './operations'

export interface BindableValue {
  id: string
  label: string
  type: CapabilityValueType
  expression: string
  source: BindingSource
}

export function bindableValues(capabilities: CapabilityInstance[], roots: DesignNode[] = []): BindableValue[] {
  const nodeLabel = (nodeId?: string) => {
    if (!nodeId) return undefined
    for (const root of roots) {
      const node = findNode(root, nodeId)
      if (node) return node.meta.name ?? node.type
    }
    return undefined
  }

  return capabilities.flatMap((capability) =>
    capability.outputs.map((output) => {
      const targetLabel = nodeLabel(capability.targetNodeId)
      const label = targetLabel ? `${targetLabel} / ${output.label.replace(/^Element /, '')}` : output.label
      return {
        id: `${capability.id}:${output.id}`,
        label,
        type: output.type,
        expression: output.localName,
        source: {
          kind: 'capability-output' as const,
          capabilityId: capability.id,
          outputId: output.id,
        },
      }
    }),
  )
}

export function technicalBindableValues(capabilities: CapabilityInstance[]): BindableValue[] {
  return capabilities.flatMap((capability) =>
    capability.outputs.map((output) => ({
      id: `${capability.id}:${output.id}`,
      label: output.label,
      type: output.type,
      expression: output.localName,
      source: {
        kind: 'capability-output' as const,
        capabilityId: capability.id,
        outputId: output.id,
      },
    })),
  )
}

export function bindingExpression(binding: Binding, capabilities: CapabilityInstance[]): string {
  if (binding.transform?.expression) return binding.transform.expression

  switch (binding.source.kind) {
    case 'expression':
      return binding.source.code
    case 'state':
    case 'prop':
      return binding.source.name
    case 'capability-output': {
      const source = binding.source
      const capability = capabilities.find((candidate) => candidate.id === source.capabilityId)
      const output = capability?.outputs.find((candidate) => candidate.id === source.outputId)
      return output?.localName ?? ''
    }
  }
}

export function bindingSourceId(source: BindingSource): string {
  switch (source.kind) {
    case 'capability-output':
      return `${source.capabilityId}:${source.outputId}`
    case 'expression':
      return `expr:${source.code}`
    case 'state':
    case 'prop':
      return `${source.kind}:${source.name}`
  }
}
