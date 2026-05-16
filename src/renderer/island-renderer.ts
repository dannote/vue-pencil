import { createApp, h, ref, type VNode, type App, type Ref } from 'vue'
import { CheckboxIndicator, CheckboxRoot, ProgressIndicator, ProgressRoot, SliderRange, SliderRoot, SliderThumb, SliderTrack, SwitchRoot, SwitchThumb } from 'reka-ui'
import type { Binding, CapabilityInstance, DesignNode } from '@/model/types'
import { bindingPreviewValue, styleBindingPreview, textBindingPreview } from './preview-values'

export interface IslandRuntime {
  capabilities: CapabilityInstance[]
  bindings: Binding[]
}

const COMPONENTS: Record<string, unknown> = {
  CheckboxIndicator,
  CheckboxRoot,
  ProgressIndicator,
  ProgressRoot,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SwitchRoot,
  SwitchThumb,
}

function renderDesignNode(node: DesignNode | string, runtime: IslandRuntime): VNode | string {
  if (typeof node === 'string') return node

  const textBinding = runtime.bindings.find((binding) => binding.target.kind === 'text' && binding.target.nodeId === node.id)
  const children = textBinding ? [textBindingPreview(textBinding, runtime.capabilities)] : node.children.map((child) => renderDesignNode(child, runtime))

  const props: Record<string, unknown> = {
    'data-node-id': node.id,
  }

  const style = { ...(node.props.style ?? {}) }
  for (const binding of runtime.bindings) {
    if (binding.target.kind !== 'style' || binding.target.nodeId !== node.id) continue
    const value = styleBindingPreview(binding, runtime.capabilities)
    if (value !== undefined) style[binding.target.property] = value
  }
  if (Object.keys(style).length > 0) props.style = style
  if (node.props.class) {
    props.class = node.props.class
  }

  for (const binding of runtime.bindings) {
    if (binding.target.kind !== 'prop' || binding.target.nodeId !== node.id || binding.transform) continue
    const propName = binding.target.prop.replace(/^:/, '')
    if (propName === 'v-model' || propName.startsWith('v-model:') || propName.startsWith('@')) continue
    const value = bindingPreviewValue(binding, runtime.capabilities)
    if (value !== undefined) props[propName] = value
  }

  // Forward remaining props (excluding style/class which are handled above)
  for (const [key, val] of Object.entries(node.props)) {
    if (key !== 'style' && key !== 'class') {
      props[key] = val
    }
  }

  return h(COMPONENTS[node.type] ?? node.type, props, children.length > 0 ? children : undefined)
}

export interface IslandApp {
  app: App
  tree: Ref<DesignNode>
  runtime: Ref<IslandRuntime>
  destroy: () => void
}

export const ISLAND_BLEED = 40

export function mountIsland(iframe: HTMLIFrameElement, initialTree: DesignNode, initialRuntime: IslandRuntime): IslandApp {
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
.vp-switch-root[data-state="checked"]{background:#4361ee!important}
.vp-switch-root[data-state="checked"] .vp-switch-thumb{transform:translateX(20px)}
.vp-checkbox-root[data-state="checked"]{background:#4361ee!important;border-color:#4361ee!important}
.vp-checkbox-root[data-state="unchecked"] .vp-checkbox-indicator{display:none}
.vp-progress-root .vp-progress-indicator{transform:translateX(-52%)}
[contenteditable]{user-select:text;-webkit-user-select:text}
</style></head><body><div id="root"></div></body></html>`,
  )
  doc.close()

  const tree: Ref<DesignNode> = ref(initialTree) as Ref<DesignNode>
  const runtime: Ref<IslandRuntime> = ref(initialRuntime) as Ref<IslandRuntime>

  const app = createApp({
    setup() {
      return () => {
        const vnode = renderDesignNode(tree.value, runtime.value)
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
    runtime,
    destroy() {
      app.unmount()
    },
  }
}
