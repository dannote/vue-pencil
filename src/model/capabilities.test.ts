import { describe, expect, it } from 'vitest'
import { createCapabilityInstance, getCapabilityDefinition } from './capabilities'

describe('capabilities', () => {
  it('creates dark mode as a component-scoped writable boolean output', () => {
    const capability = createCapabilityInstance('theme.dark-mode')

    expect(getCapabilityDefinition(capability.definitionId)?.scope).toBe('component')
    expect(capability.targetNodeId).toBeUndefined()
    expect(capability.outputs).toMatchObject([
      {
        name: 'value',
        label: 'Dark mode enabled',
        localName: 'isDark',
        type: 'boolean',
        writable: true,
      },
    ])
  })

  it('creates element-scoped outputs with target-specific names', () => {
    const capability = createCapabilityInstance('element.size', 'node-123')

    expect(capability.targetNodeId).toBe('node-123')
    expect(capability.outputs.map((output) => output.localName)).toEqual([
      'elementWidthNode',
      'elementHeightNode',
    ])
  })

  it('throws for unknown capabilities', () => {
    expect(() => createCapabilityInstance('missing')).toThrow('Unknown capability: missing')
  })
})
