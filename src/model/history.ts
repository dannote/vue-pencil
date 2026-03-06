import { ref } from 'vue'
import type { DesignNode, FrameLayout } from './types'

interface Snapshot {
  frames: DesignNode[]
  frameLayout: Record<string, FrameLayout>
}

const undoStack = ref<Snapshot[]>([])
const redoStack = ref<Snapshot[]>([])
const MAX_HISTORY = 100

function clone<T>(val: T): T {
  return structuredClone(val)
}

export function pushSnapshot(frames: DesignNode[], frameLayout: Record<string, FrameLayout>): void {
  undoStack.value.push(clone({ frames, frameLayout }))
  if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
  redoStack.value = []
}

export function undo(
  currentFrames: DesignNode[],
  currentLayout: Record<string, FrameLayout>,
): Snapshot | null {
  const snapshot = undoStack.value.pop()
  if (!snapshot) return null
  redoStack.value.push(clone({ frames: currentFrames, frameLayout: currentLayout }))
  return clone(snapshot)
}

export function redo(
  currentFrames: DesignNode[],
  currentLayout: Record<string, FrameLayout>,
): Snapshot | null {
  const snapshot = redoStack.value.pop()
  if (!snapshot) return null
  undoStack.value.push(clone({ frames: currentFrames, frameLayout: currentLayout }))
  return clone(snapshot)
}

export function canUndo(): boolean {
  return undoStack.value.length > 0
}

export function canRedo(): boolean {
  return redoStack.value.length > 0
}
