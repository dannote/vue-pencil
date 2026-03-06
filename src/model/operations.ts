import type { DesignNode } from './types'

let counter = 0

export function nodeId(): string {
  return `n${++counter}-${Date.now().toString(36)}`
}

export function createNode(
  type: string,
  style: Record<string, string> = {},
  children: (DesignNode | string)[] = [],
  name?: string,
): DesignNode {
  return {
    id: nodeId(),
    type,
    props: { style },
    children,
    meta: { name },
  }
}

export function findNode(root: DesignNode, id: string): DesignNode | null {
  if (root.id === id) return root
  for (const child of root.children) {
    if (typeof child === 'string') continue
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(root: DesignNode, id: string): { parent: DesignNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]
    if (typeof child === 'string') continue
    if (child.id === id) return { parent: root, index: i }
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function removeNode(root: DesignNode, id: string): DesignNode | null {
  const result = findParent(root, id)
  if (!result) return null
  const [removed] = result.parent.children.splice(result.index, 1)
  return removed as DesignNode
}

export function insertChild(parent: DesignNode, child: DesignNode | string, index?: number): void {
  if (index === undefined) {
    parent.children.push(child)
  } else {
    parent.children.splice(index, 0, child)
  }
}

export function moveNode(
  root: DesignNode,
  nodeId: string,
  newParentId: string,
  index: number,
): boolean {
  const node = removeNode(root, nodeId)
  if (!node) return false
  const newParent = findNode(root, newParentId)
  if (!newParent) return false
  insertChild(newParent, node, index)
  return true
}

export function updateStyle(node: DesignNode, updates: Record<string, string>): void {
  node.props.style = { ...node.props.style, ...updates }
}

export function removeStyleProps(node: DesignNode, keys: string[]): void {
  if (!node.props.style) return
  for (const key of keys) {
    delete node.props.style[key]
  }
}
