# VuePencil — Design Document

A Figma-like visual editor that constructs real Vue components. The design IS Vue. You edit a VNode tree, and the output is a `.vue` SFC that runs.

## Core Principle

**The VNode tree is the single source of truth.** The DOM is never directly mutated by tools. Every tool operation (move, resize, restyle) is a mutation of the VNode tree. Vue renders the tree into iframes. The editor reads geometry from the rendered output for overlay positioning.

## Architecture

Three layers:

```
┌─────────────────────────────────────────────────────┐
│  Editor Shell (Vue app)                             │
│  Toolbar, LayerPanel, PropertiesPanel, Overlays     │
│  Reads: model (structure), iframes (geometry)       │
│  Writes: model only                                 │
├─────────────────────────────────────────────────────┤
│  Renderer (iframes / islands)                       │
│  Each top-level frame → own iframe                  │
│  Vue compiles VNode subtree → renders into iframe   │
│  Read-only from editor's perspective                │
├─────────────────────────────────────────────────────┤
│  Model (VNode tree + Pinia store)                   │
│  All tool operations mutate this tree               │
│  Serializable to .vue SFC and back                  │
│  Undo/redo via snapshots or patches                 │
└─────────────────────────────────────────────────────┘
```

The flow for every operation:

```
User action → mutate VNode tree → iframe re-renders → 
editor reads new geometry → updates overlays
```

## VNode Model

Each node in the tree:

```ts
interface DesignNode {
  id: string                          // nanoid
  type: string                        // 'div', 'p', 'h1', 'svg', 'img', or component name
  props: {
    style?: Record<string, string>    // CSS properties as camelCase key-value
    class?: string                    // Tailwind or custom classes (future)
    [key: string]: unknown            // any HTML/Vue attribute
  }
  children: (DesignNode | string)[]   // child nodes or text content
  meta: {
    name?: string                     // layer name (user-assigned)
    locked?: boolean                  // prevent selection/editing
    hidden?: boolean                  // visibility toggle in layer panel
  }
}
```

**Why `style` as `Record<string, string>` and not typed CSS?**

Because CSS properties are the serialization format. `{ display: 'flex', gap: '12px' }` maps 1:1 to inline styles and to the `<style scoped>` block on export. No translation layer.

**Why `string` children?**

Text content. `{ type: 'p', children: ['Hello ', { type: 'strong', children: ['world'] }] }` → `<p>Hello <strong>world</strong></p>`.

### Frames (Islands)

A "frame" in Figma terms is a top-level DesignNode whose rendering is isolated in its own iframe. In the model, frames are the root-level nodes:

```ts
interface Document {
  frames: DesignNode[]                // each rendered in its own iframe
  componentDefs: ComponentDef[]       // user-created components
  // Frame position/size on the canvas is NOT in the VNode tree.
  // It's in a separate layout map:
  frameLayout: Record<string, FrameLayout>
}

interface FrameLayout {
  x: number        // canvas position
  y: number
  width: number    // iframe size
  height: number
}
```

Frame position (`x`, `y`) is canvas metadata, not CSS. It's not part of the component being designed. A frame at (500, 200) on the canvas doesn't mean the component has `left: 500px`. The frame is the artboard.

### Nested Elements

Everything inside a frame is a regular DesignNode. A div inside a flex container is a child in the `children` array. Moving it is splicing the array. No iframes, no `adoptNode`, no shadow DOM. Just VNode tree operations.

### Components

When the user creates a component (Ctrl+Alt+K):

```ts
interface ComponentDef {
  id: string
  name: string                        // PascalCase, e.g. 'MyCard'
  tree: DesignNode                    // the component's template tree
  props: PropDef[]                    // exposed props
  slots: SlotDef[]                    // named slots
}

interface PropDef {
  name: string
  type: 'string' | 'number' | 'boolean'
  default?: unknown
}

interface SlotDef {
  name: string                        // 'default', 'header', 'footer'
}
```

An instance in the tree:

```ts
{
  id: 'inst-1',
  type: 'MyCard',                     // references ComponentDef.name
  props: { title: 'Welcome' },       // prop overrides
  children: [                         // slot content
    { type: 'p', children: ['Card body text'] }
  ],
  meta: { name: 'Card Instance' }
}
```

The renderer resolves `MyCard` to its definition and renders it as a real Vue component with scoped styles (shadow DOM or `<style scoped>`).

## Renderer

Each frame gets its own iframe. The renderer:

1. Takes a `DesignNode` subtree (the frame)
2. Creates a Vue app inside the iframe
3. Uses a recursive render function that walks the DesignNode tree and calls `h()` for each node
4. Component types are resolved from `componentDefs` and registered locally
5. Re-renders reactively when the model changes

```ts
// Pseudocode
function renderNode(node: DesignNode): VNode {
  if (typeof node === 'string') return createTextVNode(node)
  
  const children = node.children.map(c => 
    typeof c === 'string' ? c : renderNode(c)
  )
  
  return h(resolveType(node.type), { 
    style: node.props.style,
    'data-node-id': node.id,    // for geometry readback
    ...node.props 
  }, children)
}
```

The `data-node-id` attribute is how the editor maps rendered DOM elements back to model nodes. When you click on the canvas, we hit-test the iframe DOM, find the `data-node-id`, and select that node in the model.

### Geometry Readback

After rendering, the editor needs bounding rects for:
- Selection overlay positioning
- Drag insertion indicators
- Resize handle placement
- Ruler measurements

```ts
function getNodeRect(frameId: string, nodeId: string): DOMRect | null {
  const iframe = getIframe(frameId)
  const el = iframe.contentDocument.querySelector(`[data-node-id="${nodeId}"]`)
  return el?.getBoundingClientRect() ?? null
}
```

This is read-only. We never mutate the iframe DOM.

## Tool Operations

Every tool is a function that takes the current model and produces a new model (or mutates reactively via Pinia actions).

### Frame Tool (F)

Click+drag on canvas:
```ts
addFrame({ 
  x, y, width, height,
  node: { id: nanoid(), type: 'div', props: { style: { position: 'relative' } }, children: [], meta: {} }
})
```

### Rectangle Tool (R)

Click+drag over a frame:
```ts
// Find which frame the cursor is over
// Create a child node in that frame's tree
insertChild(frameId, parentNodeId, {
  id: nanoid(),
  type: 'div',
  props: { style: { width: '200px', height: '120px', backgroundColor: '#D9D9D9' } },
  children: [],
  meta: { name: 'Rectangle' }
})
```

Click+drag on empty canvas → creates a new frame with a single rectangle child.

### Text Tool (T)

Same as rectangle but `type: 'p'` with text content. Double-click enters text editing mode where keystrokes modify the `children` text content.

### Move Tool (V)

**Drag absolutely positioned element:**
```ts
updateNode(nodeId, { 
  props: { style: { ...style, left: `${newX}px`, top: `${newY}px` } }
})
```

**Drag into flex container (auto-layout):**
```ts
moveNode(nodeId, newParentId, insertionIndex)
// + strip absolute positioning from the node's style
```

**Drag between frames:**
```ts
moveNodeBetweenFrames(nodeId, sourceFrameId, targetFrameId, parentNodeId, index)
// Removes from source tree, inserts into target tree
// If source frame is now empty, optionally remove it
```

**Drag out of frame to canvas:**
```ts
extractToNewFrame(nodeId, sourceFrameId, canvasX, canvasY)
// Removes node from source tree
// Creates new frame with this node as root child
```

### Resize

```ts
// Resize a frame (canvas metadata)
updateFrameLayout(frameId, { width: newW, height: newH })

// Resize an element (model mutation)
updateNode(nodeId, {
  props: { style: { ...style, width: `${newW}px`, height: `${newH}px` } }
})
```

## Edit Mode vs Preview Mode

**Edit mode:**
- Iframes are non-interactive (pointer shield over each island)
- Clicks → selection in the model
- Tool operations enabled
- Overlays visible (selection, hover, indicators)

**Preview mode:**
- Iframes are interactive (shield removed)
- Pointer events pass through to rendered content
- Buttons click, hover states work, transitions play
- No selection, no overlays, no tool operations
- Vue reactivity, event handlers, router — all live

Toggle is a single boolean that flips the shield on all islands.

## SFC Serialization

### Export (VNode tree → `.vue` SFC)

```vue
<template>
  <div style="display: flex; gap: 12px; padding: 24px; background: white; border-radius: 12px">
    <h1 style="font-size: 24px; font-weight: 700">Hello</h1>
    <p>Some text</p>
    <MyButton variant="primary">Click me</MyButton>
  </div>
</template>

<script setup lang="ts">
import MyButton from './MyButton.vue'
</script>

<style scoped>
/* extracted from inline styles when the user opts for class-based output */
</style>
```

### Import (`.vue` SFC → VNode tree)

Parse the `<template>` block with `@vue/compiler-dom`, walk the AST, build DesignNode tree. Inline styles become `props.style`. Component tags reference imported components.

This is lossy for complex SFCs (script logic, computed props, watchers). The editor handles the visual/template part. Script logic is preserved as-is on re-export.

## Undo/Redo

Two approaches:

1. **Snapshot-based:** Deep clone the entire model before each operation. Undo = restore previous snapshot. Simple, O(n) memory per operation.

2. **Patch-based:** Record JSON patches (RFC 6902) for each mutation. Undo = apply inverse patches. Memory-efficient, supports collaborative editing.

Start with snapshots. Switch to patches when the model gets large.

## Canvas Interaction

### Panview

CSS `transform: translate(panX, panY) scale(zoom)` on a container div. All islands and overlays are children of this container, so they pan/zoom together.

- Wheel → pan (or zoom with Ctrl/Cmd)
- Space+drag → pan
- Pinch → zoom
- Cmd+0 → zoom to fit
- Cmd+1 → zoom to 100%

### Selection Overlay

A div in the panview (sibling of islands, above them in z-order). Shows:
- Blue border around selected node's bounding rect
- 8 resize handles (4 corners + 4 edges)
- Zoom-compensated sizes (border width / zoom, handle size / zoom)

Positioned using geometry readback from the iframe.

### Insertion Indicator

During drag-into-flex-container:
- Read child rects from iframe
- Compute insertion index from pointer position
- Render a 2px blue line in the overlay at the gap position

### Hover Highlight

On pointermove, hit-test the iframe under the cursor. Show a light blue outline around the hovered element. Different from selection (which is darker blue with handles).

## Figma Primitives → HTML/CSS

| Figma           | VNode type + style                                          |
|-----------------|-------------------------------------------------------------|
| Frame           | `div` (+ `position: relative`, or `display: flex`)         |
| Rectangle       | `div` (+ width, height, background, border-radius)         |
| Ellipse         | `div` (+ border-radius: 50%)                               |
| Text            | `p`, `h1`–`h6`, `span` (+ font props, text content)       |
| Line            | `div` (+ height: 1px, background, rotation) or `svg > line`|
| Vector          | `svg > path`                                                |
| Group           | `div` (no styling, just grouping)                           |
| Component       | named Vue component with scoped styles                      |
| Instance        | `<ComponentName v-bind="props">`                            |
| Auto-layout     | `display: flex` + gap + padding on parent                   |
| Constraints     | `position: absolute` + inset properties                     |
| Fill            | `background-color` or `background: linear-gradient(...)`    |
| Stroke          | `border` or `outline` or `box-shadow`                       |
| Drop Shadow     | `box-shadow`                                                |
| Inner Shadow    | `box-shadow: inset ...`                                     |
| Blur            | `filter: blur()`                                            |
| Backdrop Blur   | `backdrop-filter: blur()`                                   |
| Opacity         | `opacity`                                                   |
| Blend Mode      | `mix-blend-mode`                                            |
| Clip Content    | `overflow: hidden`                                          |
| Corner Radius   | `border-radius`                                             |

## File Structure

```
src/
  model/
    types.ts              # DesignNode, ComponentDef, Document, FrameLayout
    document.ts           # Pinia store — the VNode tree + frame layouts
    operations.ts         # pure functions: insertChild, moveNode, updateStyle, etc.
    history.ts            # undo/redo stack
    serialize.ts          # VNode tree ↔ .vue SFC
  renderer/
    island-renderer.ts    # creates Vue app inside iframe, renders DesignNode subtree
    geometry.ts           # read bounding rects from iframe DOM via data-node-id
  editor/
    tools/
      select.ts           # click-to-select, marquee selection
      frame.ts            # draw new frame
      rectangle.ts        # draw rectangle
      text.ts             # create text, text editing mode
      move.ts             # drag move, auto-layout insertion
      resize.ts           # resize handles
    canvas.ts             # panview interaction (pan, zoom)
    hit-test.ts           # pointer → iframe → data-node-id → model node
    clipboard.ts          # copy/paste as VNode subtrees
  components/
    App.vue
    Canvas.vue            # panview + islands + overlays
    Island.vue            # single iframe, renders one frame's DesignNode tree
    SelectionOverlay.vue  # blue border + handles
    InsertionIndicator.vue
    HoverHighlight.vue
    Toolbar.vue
    LayerPanel.vue        # recursive tree of DesignNode
    PropertiesPanel.vue   # style editors (color picker, gradient, spacing, etc.)
  polyfill.ts             # <design-panview> custom element for pan/zoom
```
