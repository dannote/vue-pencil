import { createNode } from './operations'
import type { DesignNode } from './types'

export interface LibraryComponent {
  id: string
  name: string
  group: string
  description: string
  createNode: () => DesignNode
}

export const LIBRARY_COMPONENTS: LibraryComponent[] = [
  {
    id: 'reka.switch',
    name: 'Switch',
    group: 'Form',
    description: 'Accessible on/off control backed by Reka UI.',
    createNode: createSwitchNode,
  },
]

export function createLibraryNode(componentId: string): DesignNode {
  const component = LIBRARY_COMPONENTS.find((candidate) => candidate.id === componentId)
  if (!component) throw new Error(`Unknown library component: ${componentId}`)
  return component.createNode()
}

function createSwitchNode(): DesignNode {
  const root = createNode('SwitchRoot', {
    width: '44px',
    height: '24px',
    borderRadius: '999px',
    background: '#cdd6f4',
    border: 'none',
    padding: '2px',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }, [], 'Switch')

  root.props.value = 'on'
  root.meta.source = {
    kind: 'library',
    library: 'reka-ui',
    component: 'Switch',
    part: 'root',
  }

  const thumb = createNode('SwitchThumb', {
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  }, [], 'Thumb')

  thumb.meta.source = {
    kind: 'library',
    library: 'reka-ui',
    component: 'Switch',
    part: 'thumb',
  }

  root.children.push(thumb)
  return root
}
