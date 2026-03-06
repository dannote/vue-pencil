class PanviewElement extends HTMLElement {
  #canvas: HTMLDivElement | null = null
  #zoom = 1
  #panX = 0
  #panY = 0
  #panning = false
  #lastX = 0
  #lastY = 0
  #spaceHeld = false

  connectedCallback() {
    this.style.overflow = 'hidden'
    if (!this.style.display) this.style.display = 'block'

    this.#canvas = document.createElement('div')
    this.#canvas.style.cssText = 'transform-origin:0 0;position:absolute;inset:0'
    while (this.firstChild) this.#canvas.appendChild(this.firstChild)
    super.appendChild(this.#canvas)

    this.#updateTransform()
    this.#listen()
  }

  get zoom() {
    return this.#zoom
  }
  set zoom(v: number) {
    this.#zoom = v
    this.#updateTransform()
  }
  get panX() {
    return this.#panX
  }
  get panY() {
    return this.#panY
  }
  get spaceHeld() {
    return this.#spaceHeld
  }

  override scrollTo(xOrOptions?: ScrollToOptions | number, y?: number) {
    if (typeof xOrOptions !== 'number' || y === undefined) return
    this.#panX = xOrOptions
    this.#panY = y
    this.#updateTransform()
    this.#fire()
  }

  zoomTo(level: number, anchor?: { x: number; y: number }) {
    const ax = anchor?.x ?? this.clientWidth / 2
    const ay = anchor?.y ?? this.clientHeight / 2
    const before = this.viewportToCanvas(ax, ay)
    this.#zoom = level
    const after = this.viewportToCanvas(ax, ay)
    this.#panX += (after.x - before.x) * this.#zoom
    this.#panY += (after.y - before.y) * this.#zoom
    this.#updateTransform()
    this.#fire()
  }

  viewportToCanvas(vx: number, vy: number): DOMPoint {
    const r = this.getBoundingClientRect()
    return new DOMPoint(
      (vx - r.left - this.#panX) / this.#zoom,
      (vy - r.top - this.#panY) / this.#zoom,
    )
  }

  canvasToViewport(cx: number, cy: number): DOMPoint {
    const r = this.getBoundingClientRect()
    return new DOMPoint(cx * this.#zoom + this.#panX + r.left, cy * this.#zoom + this.#panY + r.top)
  }

  #updateTransform() {
    if (!this.#canvas) return
    this.#canvas.style.transform = `translate(${this.#panX}px,${this.#panY}px) scale(${this.#zoom})`
  }

  #fire() {
    this.dispatchEvent(new Event('viewportchange'))
  }

  #listen() {
    this.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey) {
          const factor = 1 - e.deltaY * 0.01
          this.zoomTo(Math.max(0.1, Math.min(10, this.#zoom * factor)), {
            x: e.clientX,
            y: e.clientY,
          })
        } else {
          this.#panX -= e.deltaX
          this.#panY -= e.deltaY
          this.#updateTransform()
          this.#fire()
        }
      },
      { passive: false },
    )

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.#spaceHeld = e.type === 'keydown'
        this.style.cursor = this.#spaceHeld ? 'grab' : ''
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('keyup', onKey)

    this.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.#spaceHeld || e.button === 1) {
        this.style.cursor = 'grabbing'
        this.#panning = true
        this.#lastX = e.clientX
        this.#lastY = e.clientY
        this.setPointerCapture(e.pointerId)
        e.preventDefault()
      }
    })

    this.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.#panning) return
      this.#panX += e.clientX - this.#lastX
      this.#panY += e.clientY - this.#lastY
      this.#lastX = e.clientX
      this.#lastY = e.clientY
      this.#updateTransform()
      this.#fire()
    })

    this.addEventListener('pointerup', (e: PointerEvent) => {
      if (this.#panning) {
        this.#panning = false
        this.releasePointerCapture(e.pointerId)
        this.style.cursor = this.#spaceHeld ? 'grab' : ''
      }
    })
  }

  override appendChild<T extends Node>(child: T): T {
    if (this.#canvas) return this.#canvas.appendChild(child)
    return super.appendChild(child)
  }

  override insertBefore<T extends Node>(child: T, ref: Node | null): T {
    if (this.#canvas) return this.#canvas.insertBefore(child, ref)
    return super.insertBefore(child, ref)
  }

  override removeChild<T extends Node>(child: T): T {
    if (this.#canvas) return this.#canvas.removeChild(child)
    return super.removeChild(child)
  }
}

if (!customElements.get('design-panview')) {
  customElements.define('design-panview', PanviewElement)
}

export {}
