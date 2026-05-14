import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Binding, BindingSource, BindingTarget, CapabilityInstance, ComponentDef, DesignNode, FrameLayout } from './types'
import { createCapabilityInstance } from './capabilities'
import { createLibraryNode } from './library'
import { nodeId, cloneNode, createNode, findNode, findParent, removeNode, insertChild } from './operations'
import { isLibraryInstanceRoot } from './display'

export const useDocumentStore = defineStore('document', () => {
  const frames = ref<DesignNode[]>([])
  const frameLayout = ref<Record<string, FrameLayout>>({})
  const componentDefs = ref<ComponentDef[]>([])
  const capabilities = ref<CapabilityInstance[]>([])
  const bindings = ref<Binding[]>([])

  const selectedIds = ref<Set<string>>(new Set())
  const hoveredId = ref<string | null>(null)
  const editingTextId = ref<string | null>(null)

  const selectedNodes = computed(() => {
    const result: DesignNode[] = []
    for (const id of selectedIds.value) {
      for (const frame of frames.value) {
        const node = findNode(frame, id)
        if (node) result.push(node)
      }
    }
    return result
  })

  function findFrameContaining(nodeId: string): DesignNode | null {
    for (const frame of frames.value) {
      if (findNode(frame, nodeId)) return frame
    }
    return null
  }

  function addFrame(x: number, y: number, width: number, height: number, style: Record<string, string> = {}): DesignNode {
    const node = createNode('div', { position: 'relative', ...style }, [], 'Frame')
    frames.value.push(node)
    frameLayout.value[node.id] = { x, y, width, height }
    return node
  }

  function removeFrame(frameId: string): void {
    const idx = frames.value.findIndex((f) => f.id === frameId)
    if (idx === -1) return
    frames.value.splice(idx, 1)
    delete frameLayout.value[frameId]
  }

  function addChild(
    parentId: string,
    type: string,
    style: Record<string, string> = {},
    children: (DesignNode | string)[] = [],
    index?: number,
    name?: string,
  ): DesignNode | null {
    for (const frame of frames.value) {
      const parent = findNode(frame, parentId)
      if (!parent) continue
      const child = createNode(type, style, children, name)
      insertChild(parent, child, index)
      return child
    }
    return null
  }

  function moveNodeTo(nodeIdVal: string, newParentId: string, index: number): boolean {
    // Same frame
    for (const frame of frames.value) {
      if (findNode(frame, nodeIdVal) && findNode(frame, newParentId)) {
        const node = removeNode(frame, nodeIdVal)
        if (!node) return false
        const parent = findNode(frame, newParentId)
        if (!parent) return false
        insertChild(parent, node, index)
        return true
      }
    }

    // Cross-frame
    let removed: DesignNode | null = null
    let sourceFrame: DesignNode | null = null
    for (const frame of frames.value) {
      removed = removeNode(frame, nodeIdVal)
      if (removed) {
        sourceFrame = frame
        break
      }
    }
    if (!removed) return false

    for (const frame of frames.value) {
      const parent = findNode(frame, newParentId)
      if (parent) {
        insertChild(parent, removed, index)
        // Remove source frame if empty
        if (sourceFrame && sourceFrame.children.length === 0) {
          removeFrame(sourceFrame.id)
        }
        return true
      }
    }
    return false
  }

  function select(id: string, additive = false): void {
    if (!additive) selectedIds.value.clear()
    selectedIds.value.add(id)
    // Force reactivity
    selectedIds.value = new Set(selectedIds.value)
  }

  function deselect(): void {
    selectedIds.value = new Set()
  }

  function updateNodeStyle(id: string, updates: Record<string, string>): void {
    for (const frame of frames.value) {
      const node = findNode(frame, id)
      if (node) {
        node.props.style = { ...node.props.style, ...updates }
        return
      }
    }
  }

  function updateFramePos(frameId: string, x: number, y: number): void {
    const layout = frameLayout.value[frameId]
    if (layout) {
      layout.x = x
      layout.y = y
    }
  }

  function updateFrameSize(frameId: string, width: number, height: number): void {
    const layout = frameLayout.value[frameId]
    if (layout) {
      layout.width = width
      layout.height = height
    }
  }

  function updateNodeText(id: string, children: (DesignNode | string)[]): void {
    for (const frame of frames.value) {
      const node = findNode(frame, id)
      if (node) {
        node.children = children
        return
      }
    }
  }

  function startTextEditing(id: string): void {
    editingTextId.value = id
  }

  function commitTextEdit(): void {
    editingTextId.value = null
  }

  function addCapability(definitionId: string, targetNodeId?: string): CapabilityInstance {
    const capability = createCapabilityInstance(definitionId, targetNodeId)
    capabilities.value.push(capability)
    return capability
  }

  function removeCapability(id: string): void {
    const index = capabilities.value.findIndex((capability) => capability.id === id)
    if (index !== -1) capabilities.value.splice(index, 1)
  }

  function capabilitiesForNode(nodeIdVal: string): CapabilityInstance[] {
    return capabilities.value.filter((capability) => capability.targetNodeId === nodeIdVal)
  }

  function uniqueComponentName(baseName: string): string {
    let name = baseName
    let suffix = 2
    while (componentDefs.value.some((component) => component.name === name)) {
      name = `${baseName}${suffix}`
      suffix++
    }
    return name
  }

  function createComponentFromNode(nodeIdVal: string): ComponentDef | null {
    const frame = findFrameContaining(nodeIdVal)
    if (!frame) return null
    const node = findNode(frame, nodeIdVal)
    if (!node) return null

    const baseName = node.meta.name ?? node.type
    const name = uniqueComponentName(toPascalCase(baseName))
    const component: ComponentDef = {
      id: `cmp_${crypto.randomUUID().slice(0, 8)}`,
      name,
      tree: cloneNode(node),
      props: [],
      slots: [],
    }
    componentDefs.value.push(component)

    node.meta.name = name
    node.meta.source = { kind: 'library', library: 'local', component: name, part: 'root' }
    return component
  }

  function insertLibraryComponent(componentId: string): DesignNode | null {
    const node = instantiateLibraryComponent(componentId)
    if (!node) return null
    const target = libraryInsertTarget()

    insertChild(target, node)
    select(node.id)
    return node
  }

  function insertLibraryComponentAt(componentId: string, x: number, y: number, targetNodeId?: string): DesignNode | null {
    const node = instantiateLibraryComponent(componentId)
    if (!node) return null
    const target = targetNodeId ? findNodeInDocument(targetNodeId) : null

    if (target && isContainerNode(target) && !isLibraryInstanceRoot(target)) {
      insertChild(target, node)
      select(node.id)
      return node
    }

    const frame = addFrame(x, y, 120, 80, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      borderRadius: '12px',
    })
    insertChild(frame, node)
    select(node.id)
    return node
  }

  function instantiateLibraryComponent(componentId: string): DesignNode | null {
    if (componentId.startsWith('local:')) {
      const id = componentId.slice('local:'.length)
      const component = componentDefs.value.find((candidate) => candidate.id === id)
      if (!component) return null
      const node = cloneNode(component.tree)
      node.meta.name = component.name
      node.meta.source = { kind: 'library', library: 'local', component: component.name, part: 'root' }
      return node
    }

    return createLibraryNode(componentId)
  }

  function moveFrameInto(frameId: string, parentId: string, index: number): boolean {
    const frameIndex = frames.value.findIndex((frame) => frame.id === frameId)
    if (frameIndex === -1) return false
    const [frame] = frames.value.splice(frameIndex, 1)
    delete frameLayout.value[frameId]

    for (const targetFrame of frames.value) {
      const parent = findNode(targetFrame, parentId)
      if (parent) {
        insertChild(parent, frame, index)
        select(frame.id)
        return true
      }
    }

    frames.value.splice(frameIndex, 0, frame)
    frameLayout.value[frameId] = frameLayout.value[frameId] ?? { x: 0, y: 0, width: 200, height: 120 }
    return false
  }

  function findNodeInDocument(id: string): DesignNode | null {
    for (const frame of frames.value) {
      const node = findNode(frame, id)
      if (node) return node
    }
    return null
  }

  function libraryInsertTarget(): DesignNode {
    const selected = selectedNodes.value[0]
    if (!selected) return frames.value[0] ?? addDefaultLibraryFrame()

    if (frames.value.some((frame) => frame.id === selected.id)) return selected
    if (isContainerNode(selected) && !isLibraryInstanceRoot(selected)) return selected

    for (const frame of frames.value) {
      const parent = findParent(frame, selected.id)
      if (parent) return parent.parent
    }

    return frames.value[0] ?? addDefaultLibraryFrame()
  }

  function addDefaultLibraryFrame(): DesignNode {
    return addFrame(80, 60, 160, 100, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      borderRadius: '12px',
    })
  }

  function extractNodeToFrame(nodeIdVal: string, x: number, y: number): DesignNode | null {
    let extracted: DesignNode | null = null
    let sourceFrame: DesignNode | null = null

    for (const frame of frames.value) {
      extracted = removeNode(frame, nodeIdVal)
      if (extracted) {
        sourceFrame = frame
        break
      }
    }

    if (!extracted) return null

    const width = parseInt(String(extracted.props.style?.width ?? '140'), 10) || 140
    const height = parseInt(String(extracted.props.style?.height ?? '80'), 10) || 80
    const frame = addFrame(x, y, Math.max(width + 32, 80), Math.max(height + 32, 60), {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      borderRadius: '12px',
    })
    insertChild(frame, extracted)

    if (sourceFrame && sourceFrame.children.length === 0) removeFrame(sourceFrame.id)
    select(extracted.id)
    return frame
  }

  function addBinding(target: BindingTarget, source: BindingSource): Binding {
    const existing = bindings.value.find((binding) => sameTarget(binding.target, target))
    if (existing) {
      existing.source = source
      return existing
    }

    const binding: Binding = {
      id: `bind_${crypto.randomUUID().slice(0, 8)}`,
      target,
      source,
    }
    bindings.value.push(binding)
    return binding
  }

  function removeBinding(id: string): void {
    const index = bindings.value.findIndex((binding) => binding.id === id)
    if (index !== -1) bindings.value.splice(index, 1)
  }

  function bindingForTarget(target: BindingTarget): Binding | undefined {
    return bindings.value.find((binding) => sameTarget(binding.target, target))
  }

  function bindingsForNode(nodeIdVal: string): Binding[] {
    return bindings.value.filter((binding) => 'nodeId' in binding.target && binding.target.nodeId === nodeIdVal)
  }

  return {
    frames,
    frameLayout,
    componentDefs,
    capabilities,
    bindings,
    selectedIds,
    selectedNodes,
    hoveredId,
    findFrameContaining,
    addFrame,
    removeFrame,
    addChild,
    moveNodeTo,
    select,
    deselect,
    updateNodeStyle,
    editingTextId,
    updateFramePos,
    updateFrameSize,
    updateNodeText,
    startTextEditing,
    commitTextEdit,
    addCapability,
    removeCapability,
    capabilitiesForNode,
    createComponentFromNode,
    insertLibraryComponent,
    insertLibraryComponentAt,
    moveFrameInto,
    extractNodeToFrame,
    addBinding,
    removeBinding,
    bindingForTarget,
    bindingsForNode,
  }
})

function isContainerNode(node: DesignNode): boolean {
  return !['input', 'img', 'br', 'hr'].includes(node.type)
}

function toPascalCase(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  const pascal = cleaned.replace(/(^|\s+)(\w)/g, (_, _space: string, letter: string) => letter.toUpperCase()).replace(/\s+/g, '')
  return pascal || 'Component'
}

function sameTarget(left: BindingTarget, right: BindingTarget): boolean {
  if (left.kind !== right.kind) return false

  if (left.kind === 'style' && right.kind === 'style') {
    return left.nodeId === right.nodeId && left.property === right.property
  }

  if (left.kind === 'prop' && right.kind === 'prop') {
    return left.nodeId === right.nodeId && left.prop === right.prop
  }

  if (left.kind === 'text' && right.kind === 'text') return left.nodeId === right.nodeId
  if (left.kind === 'visibility' && right.kind === 'visibility') return left.nodeId === right.nodeId

  return left.kind === 'variant' && right.kind === 'variant' && left.componentId === right.componentId && left.axis === right.axis
}
