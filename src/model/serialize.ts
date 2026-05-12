import type { Binding, CapabilityInstance, DesignNode } from './types'
import { bindingExpression } from './bindings'
import { getCapabilityDefinition } from './capabilities'

const STYLE_TO_CSS: Record<string, string> = {
  backgroundColor: 'background-color',
  borderRadius: 'border-radius',
  boxShadow: 'box-shadow',
  flexDirection: 'flex-direction',
  alignItems: 'align-items',
  justifyContent: 'justify-content',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  fontFamily: 'font-family',
  lineHeight: 'line-height',
  textAlign: 'text-align',
  userSelect: 'user-select',
  pointerEvents: 'pointer-events',
  mixBlendMode: 'mix-blend-mode',
  backdropFilter: 'backdrop-filter',
}

function camelToKebab(str: string): string {
  return STYLE_TO_CSS[str] ?? str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

function styleToString(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join('; ')
}

function indent(text: string, level: number): string {
  const pad = '  '.repeat(level)
  return text
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n')
}

const SELF_CLOSING = new Set(['input', 'img', 'br', 'hr', 'meta', 'link'])

export interface VueSfcDocument {
  root: DesignNode
  capabilities?: CapabilityInstance[]
  bindings?: Binding[]
}

export function documentToVueSfc(document: VueSfcDocument): string {
  const capabilities = document.capabilities ?? []
  const bindings = document.bindings ?? []
  const componentImports = collectRekaImports(document.root)
  const script = capabilityScript(capabilities, componentImports)
  const template = nodeToVueTemplate(document.root, 1, capabilities, bindings)

  return `${script}\n\n<template>\n${template}\n</template>`
}

export function nodeToVueTemplate(
  node: DesignNode | string,
  depth = 0,
  capabilities: CapabilityInstance[] = [],
  bindings: Binding[] = [],
): string {
  if (typeof node === 'string') return indent(escapeHtml(node), depth)

  const tag = node.type
  const attrs: string[] = []
  const textBinding = bindings.find((binding) => binding.target.kind === 'text' && binding.target.nodeId === node.id)
  const propBindings = bindings.filter((binding): binding is Binding & { target: { kind: 'prop'; nodeId: string; prop: string } } => (
    binding.target.kind === 'prop' && binding.target.nodeId === node.id
  ))

  const dynamicStyleExpressions: string[] = []
  const draggableStyle = capabilities.find(
    (capability) => capability.targetNodeId === node.id && capability.definitionId === 'element.draggable',
  )?.outputs.find((output) => output.name === 'style')

  if (node.props.style && Object.keys(node.props.style).length > 0) {
    const css = styleToString(node.props.style)
    attrs.push(`style="${escapeAttr(css)}"`)
  }

  if (draggableStyle) dynamicStyleExpressions.push(draggableStyle.localName)

  const styleBindings = bindings.filter((binding): binding is Binding & { target: { kind: 'style'; nodeId: string; property: string } } => (
    binding.target.kind === 'style' && binding.target.nodeId === node.id
  ))
  if (styleBindings.length > 0) {
    const styleBindingExpression = `{ ${styleBindings
      .map((binding) => `${JSON.stringify(binding.target.property)}: ${bindingExpression(binding, capabilities)}`)
      .join(', ')} }`
    dynamicStyleExpressions.push(styleBindingExpression)
  }

  if (dynamicStyleExpressions.length === 1) {
    attrs.push(`:style="${escapeAttr(dynamicStyleExpressions[0])}"`)
  } else if (dynamicStyleExpressions.length > 1) {
    attrs.push(`:style="${escapeAttr(`[${dynamicStyleExpressions.join(', ')}]`)}"`)
  }

  const elementCapability = capabilities.find((capability) => capability.targetNodeId === node.id)
  if (elementCapability) {
    attrs.push(`ref="${templateRefName(node.id)}"`)
  }

  if (node.props.class) {
    attrs.push(`class="${escapeAttr(node.props.class)}"`)
  }

  for (const binding of propBindings) {
    const expression = escapeAttr(bindingExpression(binding, capabilities))
    if (binding.target.prop === 'v-model' || binding.target.prop.startsWith('v-model:')) {
      attrs.push(`${binding.target.prop}="${expression}"`)
    } else if (binding.target.prop.startsWith('@')) {
      attrs.push(`${binding.target.prop}="${expression}"`)
    } else if (binding.target.prop.startsWith(':')) {
      attrs.push(`${binding.target.prop}="${expression}"`)
    } else {
      attrs.push(`:${binding.target.prop}="${expression}"`)
    }
  }

  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'style' || key === 'class' || propBindings.some((binding) => binding.target.prop === key || binding.target.prop === `:${key}`)) continue
    if (typeof val === 'string') {
      attrs.push(`${key}="${escapeAttr(val)}"`)
    } else if (typeof val === 'boolean' && val) {
      attrs.push(key)
    } else if (val !== undefined && val !== null) {
      attrs.push(`:${key}="${escapeAttr(String(val))}"`)
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

  if (SELF_CLOSING.has(tag) && node.children.length === 0) {
    return indent(`<${tag}${attrStr} />`, depth)
  }

  if (textBinding) {
    const expression = bindingExpression(textBinding, capabilities)
    const oneLine = `<${tag}${attrStr}>{{ ${expression} }}</${tag}>`
    if (oneLine.length <= 100) return indent(oneLine, depth)
    return indent(`<${tag}${attrStr}>`, depth) + '\n' + indent(`{{ ${expression} }}`, depth + 1) + '\n' + indent(`</${tag}>`, depth)
  }

  if (node.children.length === 0) {
    return indent(`<${tag}${attrStr}></${tag}>`, depth)
  }

  if (node.children.length === 1 && typeof node.children[0] === 'string') {
    const text = escapeHtml(node.children[0])
    const oneLine = `<${tag}${attrStr}>${text}</${tag}>`
    if (oneLine.length <= 80) {
      return indent(oneLine, depth)
    }
  }

  const childLines = node.children.map((c) => nodeToVueTemplate(c, depth + 1, capabilities, bindings)).join('\n')

  return indent(`<${tag}${attrStr}>`, depth) + '\n' + childLines + '\n' + indent(`</${tag}>`, depth)
}

function capabilityScript(capabilities: CapabilityInstance[], componentImports: Set<string> = new Set()): string {
  if (capabilities.length === 0 && componentImports.size === 0) return '<script setup lang="ts">\n</script>'

  const vueImports = new Set<string>()
  const vueUseImports = new Set<string>()
  const emittedRefs = new Set<string>()
  const lines: string[] = []

  for (const capability of capabilities) {
    const definition = getCapabilityDefinition(capability.definitionId)
    if (!definition) continue

    for (const composable of definition.composables) vueUseImports.add(composable)

    if (definition.scope === 'element' && capability.targetNodeId && !emittedRefs.has(capability.targetNodeId)) {
      vueImports.add('useTemplateRef')
      emittedRefs.add(capability.targetNodeId)
      lines.push(`const ${templateRefLocalName(capability.targetNodeId)} = useTemplateRef('${templateRefName(capability.targetNodeId)}')`)
    }

    if (capability.definitionId === 'theme.dark-mode') {
      const value = capability.outputs.find((output) => output.name === 'value')
      if (value) lines.push(`const ${value.localName} = useDark()`)
    }

    if (capability.definitionId === 'state.local-storage') {
      const value = capability.outputs.find((output) => output.name === 'value')
      const key = JSON.stringify(String(capability.options.key ?? 'vue-pencil-value'))
      const initialValue = JSON.stringify(String(capability.options.initialValue ?? ''))
      if (value) lines.push(`const ${value.localName} = useLocalStorage(${key}, ${initialValue})`)
    }

    if (capability.definitionId === 'element.size' && capability.targetNodeId) {
      const width = capability.outputs.find((output) => output.name === 'width')
      const height = capability.outputs.find((output) => output.name === 'height')
      if (width && height) {
        lines.push(
          `const { width: ${width.localName}, height: ${height.localName} } = useElementSize(${templateRefLocalName(capability.targetNodeId)})`,
        )
      }
    }

    if (capability.definitionId === 'element.draggable' && capability.targetNodeId) {
      const x = capability.outputs.find((output) => output.name === 'x')
      const y = capability.outputs.find((output) => output.name === 'y')
      const style = capability.outputs.find((output) => output.name === 'style')
      if (x && y && style) {
        lines.push(
          `const { x: ${x.localName}, y: ${y.localName}, style: ${style.localName} } = useDraggable(${templateRefLocalName(capability.targetNodeId)})`,
        )
      }
    }
  }

  const imports: string[] = []
  if (vueImports.size > 0) imports.push(`import { ${[...vueImports].sort().join(', ')} } from 'vue'`)
  if (vueUseImports.size > 0) imports.push(`import { ${[...vueUseImports].sort().join(', ')} } from '@vueuse/core'`)
  if (componentImports.size > 0) imports.push(`import { ${[...componentImports].sort().join(', ')} } from 'reka-ui'`)

  return ['<script setup lang="ts">', ...imports, '', ...lines, '</script>'].join('\n')
}

const REKA_COMPONENTS = new Set(['SwitchRoot', 'SwitchThumb'])

function collectRekaImports(node: DesignNode | string, imports = new Set<string>()): Set<string> {
  if (typeof node === 'string') return imports
  if (REKA_COMPONENTS.has(node.type)) imports.add(node.type)
  for (const child of node.children) collectRekaImports(child, imports)
  return imports
}

function templateRefName(nodeId: string): string {
  return `node-${nodeId}`
}

function templateRefLocalName(nodeId: string): string {
  return `node${nodeId.replace(/[^a-zA-Z0-9]/g, '')}Ref`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
