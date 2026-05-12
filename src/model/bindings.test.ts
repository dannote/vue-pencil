import { describe, expect, it } from 'vitest'
import { bindableValues, bindingExpression, bindingSourceId, technicalBindableValues } from './bindings'
import { createCapabilityInstance } from './capabilities'
import type { Binding } from './types'

describe('bindings', () => {
  it('normalizes capability outputs into bindable values', () => {
    const capability = createCapabilityInstance('element.draggable', 'card')
    const values = technicalBindableValues([capability])

    expect(values.map((value) => value.label)).toEqual(['Drag X', 'Drag Y', 'Drag style'])
    expect(values.map((value) => value.expression)).toEqual(['dragXCard', 'dragYCard', 'dragStyleCard'])
    expect(values[0].source).toEqual({
      kind: 'capability-output',
      capabilityId: capability.id,
      outputId: capability.outputs[0].id,
    })
  })

  it('uses node labels for friendly bindable values', () => {
    const capability = createCapabilityInstance('element.size', 'heading')
    const values = bindableValues([capability], [{
      id: 'frame',
      type: 'div',
      props: {},
      children: [{ id: 'heading', type: 'h1', props: {}, children: [], meta: { name: 'Heading' } }],
      meta: {},
    }])

    expect(values.map((value) => value.label)).toEqual(['Heading / width', 'Heading / height'])
  })

  it('resolves capability output binding expressions', () => {
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

    expect(bindingExpression(binding, [capability])).toBe('isDark')
  })

  it('prefers transform expressions over source expressions', () => {
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'text', nodeId: 'label' },
      source: { kind: 'state', name: 'count' },
      transform: { expression: 'Math.round(count)' },
    }

    expect(bindingExpression(binding, [])).toBe('Math.round(count)')
  })

  it('builds stable ids for binding sources', () => {
    expect(bindingSourceId({ kind: 'state', name: 'count' })).toBe('state:count')
    expect(bindingSourceId({ kind: 'expression', code: 'count + 1' })).toBe('expr:count + 1')
  })
})
