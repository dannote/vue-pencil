import type { DesignNode } from './types'

export function isLibraryNode(node: DesignNode): boolean {
  return node.meta.source?.kind === 'library'
}

export function isLibraryInstanceRoot(node: DesignNode): boolean {
  return node.meta.source?.kind === 'library' && node.meta.source.part === 'root'
}

export function nodeDisplayName(node: DesignNode): string {
  if (node.meta.slot) return node.meta.slot.label

  if (node.meta.source?.kind === 'library') {
    return node.meta.name ?? node.meta.source.component
  }

  return node.meta.name ?? `<${node.type}>`
}

export function nodeDisplayKind(node: DesignNode): string {
  if (node.meta.slot) return 'Slot'

  if (node.meta.source?.kind === 'library') {
    if (node.meta.source.part === 'root') return `${node.meta.source.component} instance`
    if (node.meta.source.part) return `${node.meta.source.component} ${node.meta.source.part}`
    return `${node.meta.source.component} library node`
  }

  return `<${node.type}>`
}

export function nodeDisplayDetail(node: DesignNode): string | undefined {
  if (node.meta.slot) return node.meta.slot.name
  if (node.meta.source?.kind === 'library') return node.meta.source.library
  return undefined
}
