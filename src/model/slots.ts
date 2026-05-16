import { createNode } from './operations'
import type { DesignNode, SlotMeta } from './types'

export function createSlotNode(meta: SlotMeta, children: (DesignNode | string)[] = []): DesignNode {
  const node = createNode('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: children.length > 0 ? 'auto' : '36px',
    padding: children.length > 0 ? '0' : '8px',
    borderRadius: '10px',
    outline: children.length > 0 ? 'none' : '1px dashed rgba(244, 114, 182, 0.28)',
    outlineOffset: '-1px',
  }, children, `${meta.label} slot`)

  node.meta.slot = meta
  return node
}

export function isSlotNode(node: DesignNode): boolean {
  return Boolean(node.meta.slot)
}

export function slotPlaceholder(node: DesignNode): string {
  return node.meta.slot?.placeholder ?? `Drop into ${node.meta.slot?.label ?? 'slot'}`
}
