export interface DesignNode {
  id: string
  type: string
  props: {
    style?: Record<string, string>
    class?: string
    [key: string]: unknown
  }
  children: (DesignNode | string)[]
  meta: {
    name?: string
    locked?: boolean
    hidden?: boolean
    source?: NodeSource
  }
}

export type NodeSource =
  | { kind: 'html' }
  | {
      kind: 'library'
      library: string
      component: string
      part?: string
    }

export interface FrameLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface ComponentDef {
  id: string
  name: string
  tree: DesignNode
  props: PropDef[]
  slots: SlotDef[]
}

export interface PropDef {
  name: string
  type: 'string' | 'number' | 'boolean'
  default?: unknown
}

export interface SlotDef {
  name: string
}

export type CapabilityScope = 'component' | 'element'

export type CapabilityValueType = 'boolean' | 'number' | 'string' | 'style' | 'object'

export interface CapabilityOutputInstance {
  id: string
  name: string
  label: string
  localName: string
  type: CapabilityValueType
  writable: boolean
}

export interface CapabilityActionInstance {
  id: string
  name: string
  label: string
  localName: string
}

export interface CapabilityInstance {
  id: string
  definitionId: string
  targetNodeId?: string
  options: Record<string, unknown>
  outputs: CapabilityOutputInstance[]
  actions: CapabilityActionInstance[]
}

export type BindingTarget =
  | { kind: 'prop'; nodeId: string; prop: string }
  | { kind: 'style'; nodeId: string; property: string }
  | { kind: 'text'; nodeId: string }
  | { kind: 'visibility'; nodeId: string }
  | { kind: 'variant'; componentId: string; axis: string }

export type BindingSource =
  | { kind: 'capability-output'; capabilityId: string; outputId: string }
  | { kind: 'state'; name: string }
  | { kind: 'prop'; name: string }
  | { kind: 'expression'; code: string }

export interface BindingTransform {
  expression: string
}

export interface Binding {
  id: string
  target: BindingTarget
  source: BindingSource
  transform?: BindingTransform
}

export interface DesignDocument {
  frames: DesignNode[]
  frameLayout: Record<string, FrameLayout>
  componentDefs: ComponentDef[]
  capabilities: CapabilityInstance[]
  bindings: Binding[]
}
