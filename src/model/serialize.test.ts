import { describe, expect, it } from 'vitest'
import { createCapabilityInstance } from './capabilities'
import { documentToVueSfc, nodeToVueTemplate } from './serialize'
import type { Binding, DesignNode } from './types'

function node(overrides: Partial<DesignNode> = {}): DesignNode {
  return {
    id: 'card',
    type: 'div',
    props: { style: { color: 'red' } },
    children: ['Hello'],
    meta: { name: 'Card' },
    ...overrides,
  }
}

describe('serialize', () => {
  it('serializes plain nodes as Vue template', () => {
    expect(nodeToVueTemplate(node())).toBe('<div style="color: red">Hello</div>')
  })

  it('emits VueUse script setup for dark mode', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const sfc = documentToVueSfc({ root: node(), capabilities: [capability] })

    expect(sfc).toContain("import { useDark } from '@vueuse/core'")
    expect(sfc).toContain('const isDark = useDark()')
  })

  it('adds template refs and useElementSize for element-scoped capabilities', () => {
    const capability = createCapabilityInstance('element.size', 'card')
    const sfc = documentToVueSfc({ root: node(), capabilities: [capability] })

    expect(sfc).toContain("import { useTemplateRef } from 'vue'")
    expect(sfc).toContain("import { useElementSize } from '@vueuse/core'")
    expect(sfc).toContain("const nodecardRef = useTemplateRef('node-card')")
    expect(sfc).toContain('useElementSize(nodecardRef)')
    expect(sfc).toContain('<div style="color: red" ref="node-card">Hello</div>')
  })

  it('binds text content to capability output expressions', () => {
    const capability = createCapabilityInstance('element.size', 'card')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'text', nodeId: 'card' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    const sfc = documentToVueSfc({ root: node(), capabilities: [capability], bindings: [binding] })

    expect(sfc).toContain('<div style="color: red" ref="node-card">{{ elementWidthCard }}</div>')
  })

  it('attaches draggable style output as a dynamic style binding', () => {
    const capability = createCapabilityInstance('element.draggable', 'card')
    const sfc = documentToVueSfc({ root: node(), capabilities: [capability] })

    expect(sfc).toContain('const { x: dragXCard, y: dragYCard, style: dragStyleCard } = useDraggable(nodecardRef)')
    expect(sfc).toContain('<div style="color: red" :style="dragStyleCard" ref="node-card">Hello</div>')
  })

  it('emits style bindings as dynamic style objects', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'style', nodeId: 'card', property: 'opacity' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
      transform: { expression: "isDark ? '1' : '0.4'" },
    }

    const sfc = documentToVueSfc({ root: node(), capabilities: [capability], bindings: [binding] })

    expect(sfc).toContain(`<div style="color: red" :style="{ &quot;opacity&quot;: isDark ? '1' : '0.4' }">`)
    expect(sfc).toContain('Hello')
  })

  it('merges draggable style and explicit style bindings into a style array', () => {
    const draggable = createCapabilityInstance('element.draggable', 'card')
    const darkMode = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'style', nodeId: 'card', property: 'opacity' },
      source: {
        kind: 'capability-output',
        capabilityId: darkMode.id,
        outputId: darkMode.outputs[0].id,
      },
    }

    const sfc = documentToVueSfc({ root: node(), capabilities: [draggable, darkMode], bindings: [binding] })

    expect(sfc).toContain(':style="[dragStyleCard, { &quot;opacity&quot;: isDark }]"')
  })

  it('emits prop bindings as dynamic attributes', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'prop', nodeId: 'card', prop: 'disabled' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    const sfc = documentToVueSfc({ root: node({ type: 'button' }), capabilities: [capability], bindings: [binding] })

    expect(sfc).toContain('<button style="color: red" :disabled="isDark">Hello</button>')
  })

  it('imports Reka components used by the tree', () => {
    const root = node({
      type: 'SwitchRoot',
      children: [node({ id: 'thumb', type: 'SwitchThumb', children: [] })],
    })

    const sfc = documentToVueSfc({ root })

    expect(sfc).toContain("import { SwitchRoot, SwitchThumb } from 'reka-ui'")
    expect(sfc).toContain('<SwitchRoot style="color: red">')
    expect(sfc).toContain('<SwitchThumb style="color: red"></SwitchThumb>')
  })

  it('emits v-model prop bindings without adding a colon', () => {
    const capability = createCapabilityInstance('theme.dark-mode')
    const binding: Binding = {
      id: 'binding',
      target: { kind: 'prop', nodeId: 'card', prop: 'v-model' },
      source: {
        kind: 'capability-output',
        capabilityId: capability.id,
        outputId: capability.outputs[0].id,
      },
    }

    const sfc = documentToVueSfc({ root: node({ type: 'SwitchRoot' }), capabilities: [capability], bindings: [binding] })

    expect(sfc).toContain('<SwitchRoot style="color: red" v-model="isDark">Hello</SwitchRoot>')
  })
})
