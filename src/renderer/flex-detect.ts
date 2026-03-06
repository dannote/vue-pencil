import type { DesignNode } from '@/model/types'

export function isFlexContainer(node: DesignNode): boolean {
  const display = node.props.style?.display
  return display === 'flex' || display === 'inline-flex'
}

export function getFlexDirection(node: DesignNode): 'row' | 'column' {
  const dir = node.props.style?.flexDirection
  if (dir === 'column' || dir === 'column-reverse') return 'column'
  return 'row'
}
