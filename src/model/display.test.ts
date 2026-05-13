import { describe, expect, it } from 'vitest'
import { nodeDisplayDetail, nodeDisplayKind, nodeDisplayName } from './display'
import type { DesignNode } from './types'

describe('display helpers', () => {
  it('shows html nodes with tag kind and meta name', () => {
    const node: DesignNode = { id: 'n', type: 'h1', props: {}, children: [], meta: { name: 'Heading' } }

    expect(nodeDisplayName(node)).toBe('Heading')
    expect(nodeDisplayKind(node)).toBe('<h1>')
    expect(nodeDisplayDetail(node)).toBeUndefined()
  })

  it('shows library roots as component instances', () => {
    const node: DesignNode = {
      id: 'n',
      type: 'SwitchRoot',
      props: {},
      children: [],
      meta: { source: { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'root' } },
    }

    expect(nodeDisplayName(node)).toBe('Switch')
    expect(nodeDisplayKind(node)).toBe('Switch instance')
    expect(nodeDisplayDetail(node)).toBe('reka-ui')
  })

  it('shows library parts as component parts', () => {
    const node: DesignNode = {
      id: 'n',
      type: 'SwitchThumb',
      props: {},
      children: [],
      meta: { name: 'Thumb', source: { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'thumb' } },
    }

    expect(nodeDisplayName(node)).toBe('Thumb')
    expect(nodeDisplayKind(node)).toBe('Switch thumb')
  })
})
