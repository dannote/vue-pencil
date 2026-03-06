import type { FrameLayout } from '@/model/types'

export interface NodeRect {
  x: number
  y: number
  width: number
  height: number
}

export function getNodeRect(
  iframe: HTMLIFrameElement,
  nodeId: string,
): NodeRect | null {
  const el = iframe.contentDocument?.querySelector(`[data-node-id="${nodeId}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

export function nodeRectToCanvas(
  nodeRect: NodeRect,
  frameLayout: FrameLayout,
): NodeRect {
  return {
    x: frameLayout.x + nodeRect.x,
    y: frameLayout.y + nodeRect.y,
    width: nodeRect.width,
    height: nodeRect.height,
  }
}

export function getChildRects(
  iframe: HTMLIFrameElement,
  parentNodeId: string,
): { nodeId: string; rect: NodeRect }[] {
  const parent = iframe.contentDocument?.querySelector(
    `[data-node-id="${parentNodeId}"]`,
  )
  if (!parent) return []

  const result: { nodeId: string; rect: NodeRect }[] = []
  for (const child of parent.children) {
    const id = child.getAttribute('data-node-id')
    if (!id) continue
    const rect = child.getBoundingClientRect()
    result.push({
      nodeId: id,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    })
  }
  return result
}

export function computeInsertionIndex(
  childRects: { rect: NodeRect }[],
  pointerLocal: { x: number; y: number },
  direction: 'row' | 'column',
): number {
  const axis = direction === 'row' ? 'x' : 'y'
  const size = direction === 'row' ? 'width' : 'height'

  for (let i = 0; i < childRects.length; i++) {
    const r = childRects[i].rect
    const midpoint = r[axis] + r[size] / 2
    if (pointerLocal[axis] < midpoint) return i
  }
  return childRects.length
}

export function getInsertionLinePosition(
  childRects: { rect: NodeRect }[],
  index: number,
  parentRect: NodeRect,
  direction: 'row' | 'column',
): { x: number; y: number; width: number; height: number } {
  const isRow = direction === 'row'

  if (childRects.length === 0) {
    return isRow
      ? { x: parentRect.x + 2, y: parentRect.y, width: 2, height: parentRect.height }
      : { x: parentRect.x, y: parentRect.y + 2, width: parentRect.width, height: 2 }
  }

  if (index === 0) {
    const first = childRects[0].rect
    return isRow
      ? { x: first.x - 1, y: parentRect.y, width: 2, height: parentRect.height }
      : { x: parentRect.x, y: first.y - 1, width: parentRect.width, height: 2 }
  }

  if (index >= childRects.length) {
    const last = childRects[childRects.length - 1].rect
    return isRow
      ? { x: last.x + last.width - 1, y: parentRect.y, width: 2, height: parentRect.height }
      : { x: parentRect.x, y: last.y + last.height - 1, width: parentRect.width, height: 2 }
  }

  const prev = childRects[index - 1].rect
  const next = childRects[index].rect
  if (isRow) {
    const midX = (prev.x + prev.width + next.x) / 2
    return { x: midX - 1, y: parentRect.y, width: 2, height: parentRect.height }
  }
  const midY = (prev.y + prev.height + next.y) / 2
  return { x: parentRect.x, y: midY - 1, width: parentRect.width, height: 2 }
}
