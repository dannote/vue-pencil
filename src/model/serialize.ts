import type { DesignNode } from './types'

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

export function nodeToVueTemplate(node: DesignNode | string, depth = 0): string {
  if (typeof node === 'string') return indent(escapeHtml(node), depth)

  const tag = node.type
  const attrs: string[] = []

  if (node.props.style && Object.keys(node.props.style).length > 0) {
    const css = styleToString(node.props.style)
    attrs.push(`style="${escapeAttr(css)}"`)
  }

  if (node.props.class) {
    attrs.push(`class="${escapeAttr(node.props.class)}"`)
  }

  for (const [key, val] of Object.entries(node.props)) {
    if (key === 'style' || key === 'class') continue
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

  const childLines = node.children.map((c) => nodeToVueTemplate(c, depth + 1)).join('\n')

  return indent(`<${tag}${attrStr}>`, depth) + '\n' + childLines + '\n' + indent(`</${tag}>`, depth)
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
