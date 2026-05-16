import { createNode } from './operations'
import type { DesignNode } from './types'

export interface LibraryComponent {
  id: string
  name: string
  group: string
  description: string
  createNode: () => DesignNode
}

export const LIBRARY_COMPONENTS: LibraryComponent[] = [
  {
    id: 'reka.switch',
    name: 'Switch',
    group: 'Form',
    description: 'Accessible on/off control backed by Reka UI.',
    createNode: createSwitchNode,
  },
  {
    id: 'reka.checkbox',
    name: 'Checkbox',
    group: 'Form',
    description: 'Accessible checkbox with semantic indicator part.',
    createNode: createCheckboxNode,
  },
  {
    id: 'reka.slider',
    name: 'Slider',
    group: 'Form',
    description: 'Accessible range slider with track, range, and thumb parts.',
    createNode: createSliderNode,
  },
  {
    id: 'reka.progress',
    name: 'Progress',
    group: 'Feedback',
    description: 'Progress meter with value-driven indicator.',
    createNode: createProgressNode,
  },
]

export function createLibraryNode(componentId: string): DesignNode {
  const component = LIBRARY_COMPONENTS.find((candidate) => candidate.id === componentId)
  if (!component) throw new Error(`Unknown library component: ${componentId}`)
  return component.createNode()
}

function createSwitchNode(): DesignNode {
  const root = createNode('SwitchRoot', {
    width: '44px',
    height: '24px',
    borderRadius: '999px',
    background: '#cdd6f4',
    border: 'none',
    padding: '2px',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }, [], 'Switch')

  root.props.defaultValue = false
  root.props.class = 'vp-switch-root'
  root.meta.source = {
    kind: 'library',
    library: 'reka-ui',
    component: 'Switch',
    part: 'root',
  }

  const thumb = createNode('SwitchThumb', {
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  }, [], 'Thumb')

  thumb.props.class = 'vp-switch-thumb'

  thumb.meta.source = {
    kind: 'library',
    library: 'reka-ui',
    component: 'Switch',
    part: 'thumb',
  }

  root.children.push(thumb)
  return root
}

function createCheckboxNode(): DesignNode {
  const root = createNode('CheckboxRoot', {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    background: 'white',
    border: '2px solid #cdd6f4',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    transition: 'background 0.2s, border-color 0.2s',
  }, [], 'Checkbox')

  root.props.defaultValue = false
  root.props.class = 'vp-checkbox-root'
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Checkbox', part: 'root' }

  const indicator = createNode('CheckboxIndicator', {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    background: 'currentColor',
  }, [], 'Indicator')

  indicator.props.class = 'vp-checkbox-indicator'
  indicator.meta.source = { kind: 'library', library: 'reka-ui', component: 'Checkbox', part: 'indicator' }
  root.children.push(indicator)
  return root
}

function createSliderNode(): DesignNode {
  const root = createNode('SliderRoot', {
    width: '180px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    cursor: 'pointer',
  }, [], 'Slider')

  root.props.defaultValue = [48]
  root.props.max = 100
  root.props.step = 1
  root.props.class = 'vp-slider-root'
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Slider', part: 'root' }

  const track = createNode('SliderTrack', {
    position: 'relative',
    flexGrow: '1',
    height: '6px',
    borderRadius: '999px',
    background: '#313244',
    overflow: 'hidden',
  }, [], 'Track')
  track.meta.source = { kind: 'library', library: 'reka-ui', component: 'Slider', part: 'track' }

  const range = createNode('SliderRange', {
    position: 'absolute',
    height: '100%',
    borderRadius: '999px',
    background: '#4361ee',
  }, [], 'Range')
  range.meta.source = { kind: 'library', library: 'reka-ui', component: 'Slider', part: 'range' }

  const thumb = createNode('SliderThumb', {
    display: 'block',
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    background: 'white',
    border: '2px solid #4361ee',
    boxShadow: '0 2px 8px rgba(0,0,0,0.24)',
  }, [], 'Thumb')
  thumb.meta.source = { kind: 'library', library: 'reka-ui', component: 'Slider', part: 'thumb' }

  track.children.push(range)
  root.children.push(track, thumb)
  return root
}

function createProgressNode(): DesignNode {
  const root = createNode('ProgressRoot', {
    width: '180px',
    height: '10px',
    borderRadius: '999px',
    background: '#313244',
    overflow: 'hidden',
  }, [], 'Progress')

  root.props.modelValue = 48
  root.props.class = 'vp-progress-root'
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Progress', part: 'root' }

  const indicator = createNode('ProgressIndicator', {
    width: '48%',
    height: '100%',
    borderRadius: '999px',
    background: '#4361ee',
    transition: 'width 0.2s',
  }, [], 'Indicator')
  indicator.props.class = 'vp-progress-indicator'
  indicator.meta.source = { kind: 'library', library: 'reka-ui', component: 'Progress', part: 'indicator' }

  root.children.push(indicator)
  return root
}
