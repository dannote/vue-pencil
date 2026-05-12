import type { Binding, CapabilityInstance } from '@/model/types'
import { bindingExpression } from '@/model/bindings'

export function capabilityOutputPreviewValue(capability: CapabilityInstance, outputId: string): unknown {
  const output = capability.outputs.find((candidate) => candidate.id === outputId)
  if (!output) return undefined

  switch (capability.definitionId) {
    case 'theme.dark-mode':
      return false
    case 'state.local-storage':
      return capability.options.initialValue ?? ''
    case 'element.size':
      return output.name === 'width' ? 320 : 120
    case 'element.draggable':
      if (output.name === 'style') return undefined
      return 0
    default:
      return output.localName
  }
}

export function bindingPreviewValue(binding: Binding, capabilities: CapabilityInstance[]): unknown {
  if (binding.transform?.expression) return bindingExpression(binding, capabilities)

  switch (binding.source.kind) {
    case 'capability-output': {
      const source = binding.source
      const capability = capabilities.find((candidate) => candidate.id === source.capabilityId)
      return capability ? capabilityOutputPreviewValue(capability, source.outputId) : undefined
    }
    case 'state':
    case 'prop':
      return binding.source.name
    case 'expression':
      return binding.source.code
  }
}

export function textBindingPreview(binding: Binding, capabilities: CapabilityInstance[]): string {
  const value = bindingPreviewValue(binding, capabilities)
  if (value === undefined || value === null) return bindingExpression(binding, capabilities)
  return String(value)
}

export function styleBindingPreview(binding: Binding, capabilities: CapabilityInstance[]): string | undefined {
  if (binding.transform?.expression) return undefined
  const value = bindingPreviewValue(binding, capabilities)
  if (value === undefined || value === null) return undefined
  return String(value)
}
