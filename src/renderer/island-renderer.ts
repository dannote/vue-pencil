import { createApp, h, ref, type VNode, type App, type Ref } from 'vue'
import type { DesignNode } from '@/model/types'

function renderDesignNode(node: DesignNode | string): VNode | string {
  if (typeof node === 'string') return node

  const children = node.children.map(renderDesignNode)

  const props: Record<string, unknown> = {
    'data-node-id': node.id,
  }

  if (node.props.style) {
    props.style = { ...node.props.style }
  }
  if (node.props.class) {
    props.class = node.props.class
  }

  // Forward remaining props (excluding style/class which are handled above)
  for (const [key, val] of Object.entries(node.props)) {
    if (key !== 'style' && key !== 'class') {
      props[key] = val
    }
  }

  return h(node.type, props, children.length > 0 ? children : undefined)
}

export interface IslandApp {
  app: App
  tree: Ref<DesignNode>
  destroy: () => void
}

export const ISLAND_BLEED = 40

export function mountIsland(iframe: HTMLIFrameElement, initialTree: DesignNode): IslandApp {
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(
    `<!DOCTYPE html><html><head><style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;height:100%;background:transparent;user-select:none;-webkit-user-select:none;overflow:hidden}
#root{margin:${ISLAND_BLEED}px;height:calc(100% - ${ISLAND_BLEED * 2}px)}
button:hover{filter:brightness(1.1)}
button:active{transform:scale(0.97)}
input:focus{border-color:#4361ee !important}
[style*="cursor: pointer"]:hover{transform:scale(1.03)}
[contenteditable]{user-select:text;-webkit-user-select:text}
</style></head><body><div id="root"></div></body></html>`,
  )
  doc.close()

  const tree: Ref<DesignNode> = ref(initialTree) as Ref<DesignNode>

  const app = createApp({
    setup() {
      return () => {
        const vnode = renderDesignNode(tree.value)
        // Root element fills the island
        if (typeof vnode !== 'string' && vnode.props) {
          vnode.props.style = { width: '100%', height: '100%', ...vnode.props.style }
        }
        return vnode
      }
    },
  })

  app.mount(doc.getElementById('root')!)

  return {
    app,
    tree,
    destroy() {
      app.unmount()
    },
  }
}
