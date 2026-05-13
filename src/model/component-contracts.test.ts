import { describe, expect, it } from 'vitest'
import { componentPartNodes, componentPropertyTarget, getComponentContract } from './component-contracts'
import type { DesignNode } from './types'

const switchNode: DesignNode = {
  id: 'switch',
  type: 'SwitchRoot',
  props: {},
  children: [],
  meta: { name: 'Switch' },
}

describe('component contracts', () => {
  it('finds the Switch contract', () => {
    const contract = getComponentContract(switchNode)

    expect(contract?.label).toBe('Switch')
    expect(contract?.properties.map((property) => property.label)).toEqual(['Value', 'Disabled'])
  })

  it('maps Switch value to v-model prop binding target', () => {
    const contract = getComponentContract(switchNode)
    const valueProperty = contract?.properties.find((property) => property.id === 'value')

    expect(valueProperty).toBeDefined()
    expect(componentPropertyTarget(switchNode, valueProperty!)).toEqual({
      kind: 'prop',
      nodeId: 'switch',
      prop: 'v-model',
    })
  })

  it('finds semantic Switch parts', () => {
    const thumb: DesignNode = {
      id: 'thumb',
      type: 'SwitchThumb',
      props: {},
      children: [],
      meta: { name: 'Thumb', source: { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'thumb' } },
    }
    const root: DesignNode = {
      ...switchNode,
      meta: { name: 'Switch', source: { kind: 'library', library: 'reka-ui', component: 'Switch', part: 'root' } },
      children: [thumb],
    }

    const contract = getComponentContract(root)

    expect(componentPartNodes(root, contract!).map((part) => [part.contract.label, part.node.id])).toEqual([
      ['Track', 'switch'],
      ['Thumb', 'thumb'],
    ])
  })
})
