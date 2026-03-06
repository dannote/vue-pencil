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
  }
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

export interface DesignDocument {
  frames: DesignNode[]
  frameLayout: Record<string, FrameLayout>
  componentDefs: ComponentDef[]
}
