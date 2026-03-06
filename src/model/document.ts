import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DesignNode, FrameLayout, ComponentDef } from './types'
import { nodeId, createNode, findNode, findParent, removeNode, insertChild } from './operations'

export const useDocumentStore = defineStore('document', () => {
  const frames = ref<DesignNode[]>([])
  const frameLayout = ref<Record<string, FrameLayout>>({})
  const componentDefs = ref<ComponentDef[]>([])

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

  return {
    frames,
    frameLayout,
    componentDefs,
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
  }
})
