/// <reference types="vite/client" />

interface HTMLPanviewElement extends HTMLElement {
  zoom: number
  readonly panX: number
  readonly panY: number
  readonly spaceHeld: boolean
  scrollTo(options?: ScrollToOptions): void
  scrollTo(x: number, y: number): void
  zoomTo(level: number, anchor?: { x: number; y: number }): void
  viewportToCanvas(vx: number, vy: number): DOMPoint
  canvasToViewport(cx: number, cy: number): DOMPoint
}

interface HTMLElementTagNameMap {
  'design-panview': HTMLPanviewElement
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'virtual:icons/*' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}

declare module '~icons/*' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  const component: FunctionalComponent<SVGAttributes>
  export default component
}
