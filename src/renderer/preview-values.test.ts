import { describe, expect, it } from 'vitest'
import { createCapabilityInstance } from '@/model/capabilities'
import { bindingPreviewValue, styleBindingPreview, textBindingPreview } from './preview-values'
import type { Binding } from '@/model/types'

describe('preview values', () => {
  it('previews dark mode as false', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'text', nodeId: 'label' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    expect(bindingPreviewValue(binding, [capability])).toBe(false)
    expect(textBindingPreview(binding, [capability])).toBe('false')
  })

  it('uses local storage initial value for preview', () => {
    const capability = createCapabilityInstance('state.local-storage')
    capability.options.initialValue = 'hello'
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'text', nodeId: 'label' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    expect(textBindingPreview(binding, [capability])).toBe('hello')
  })

  it('previews element size with placeholder geometry', () => {
    const capability = createCapabilityInstance('element.size', 'card')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'style', nodeId: 'label', property: 'width' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    expect(styleBindingPreview(binding, [capability])).toBe('320')
  })

  it('does not evaluate transform expressions for style preview', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'style', nodeId: 'label', property: 'opacity' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
      transform: { expression: "isDark ? '1' : '0.4'" },
    }

    expect(styleBindingPreview(binding, [capability])).toBeUndefined()
    expect(textBindingPreview(binding, [capability])).toBe("isDark ? '1' : '0.4'")
  })
})
