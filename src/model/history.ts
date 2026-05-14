import { ref } from 'vue'
import type { Binding, CapabilityInstance, ComponentDef, DesignNode, FrameLayout } from './types'

export interface Snapshot {
  frames: DesignNode[]
  frameLayout: Record<string, FrameLayout>
  componentDefs: ComponentDef[]
  capabilities: CapabilityInstance[]
  bindings: Binding[]
}

const undoStack = ref<Snapshot[]>([])
const redoStack = ref<Snapshot[]>([])
const MAX_HISTORY = 100

function clone<T>(val: T): T {
  return structuredClone(val)
}

export function pushSnapshot(snapshot: Snapshot): void {
  undoStack.value.push(clone(snapshot))
  if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
  redoStack.value = []
}

export function undo(current: Snapshot): Snapshot | null {
  const snapshot = undoStack.value.pop()
  if (!snapshot) return null
  redoStack.value.push(clone(current))
  return clone(snapshot)
}

export function redo(current: Snapshot): Snapshot | null {
  const snapshot = redoStack.value.pop()
  if (!snapshot) return null
  undoStack.value.push(clone(current))
  return clone(snapshot)
}

export function canUndo(): boolean {
  return undoStack.value.length > 0
}

export function canRedo(): boolean {
  return redoStack.value.length > 0
}
