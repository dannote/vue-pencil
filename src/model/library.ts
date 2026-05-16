import { createNode } from './operations'
import { createSlotNode } from './slots'
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
  {
    id: 'layout.card',
    name: 'Card',
    group: 'Layout',
    description: 'Composable card with Header, Body, and Footer slots.',
    createNode: createCardNode,
  },
  {
    id: 'reka.tabs',
    name: 'Tabs',
    group: 'Navigation',
    description: 'Tabbed interface with semantic list, triggers, and panels.',
    createNode: createTabsNode,
  },
  {
    id: 'reka.accordion',
    name: 'Accordion',
    group: 'Disclosure',
    description: 'Expandable content sections with trigger and content parts.',
    createNode: createAccordionNode,
  },
  {
    id: 'reka.collapsible',
    name: 'Collapsible',
    group: 'Disclosure',
    description: 'Single expandable region with trigger and content parts.',
    createNode: createCollapsibleNode,
  },
]

export function createLibraryNode(componentId: string): DesignNode {
  const component = LIBRARY_COMPONENTS.find((candidate) => candidate.id === componentId)
  if (!component) throw new Error(`Unknown library component: ${componentId}`)
  return component.createNode()
}

function createCardNode(): DesignNode {
  const root = createNode('div', {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '18px',
    borderRadius: '18px',
    background: 'white',
    color: '#1e1e2e',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  }, [], 'Card')

  root.meta.source = { kind: 'library', library: 'vue-pencil', component: 'Card', part: 'root' }
  root.children.push(
    createSlotNode({ name: 'header', label: 'Header', preferredComponents: ['layout.heading'], placeholder: 'Drop header content' }, [
      createNode('h2', { margin: '0', fontSize: '20px', fontWeight: '800' }, ['Card title'], 'Title'),
    ]),
    createSlotNode({ name: 'default', label: 'Body', placeholder: 'Drop body content' }, [
      createNode('p', { margin: '0', color: '#6c7086', fontSize: '14px', lineHeight: '1.5' }, ['Compose this card by dropping layers or assets into slots.'], 'Body text'),
    ]),
    createSlotNode({ name: 'footer', label: 'Footer', preferredComponents: ['reka.switch', 'reka.checkbox'], placeholder: 'Drop footer actions' }),
  )
  return root
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

function createTabsNode(): DesignNode {
  const root = createNode('TabsRoot', {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  }, [], 'Tabs')
  root.props.defaultValue = 'overview'
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Tabs', part: 'root' }

  const list = createNode('TabsList', {
    display: 'inline-flex',
    gap: '4px',
    padding: '4px',
    borderRadius: '10px',
    background: '#313244',
  }, [], 'List')
  list.meta.source = { kind: 'library', library: 'reka-ui', component: 'Tabs', part: 'list' }
  list.children.push(createTabsTriggerNode('Overview', 'overview'), createTabsTriggerNode('Details', 'details'))

  root.children.push(
    list,
    createTabsContentNode('Overview panel', 'overview', 'Build interactive Vue UI visually.'),
    createTabsContentNode('Details panel', 'details', 'Bind props to capabilities and export real code.'),
  )
  return root
}

function createTabsTriggerNode(name: string, value: string): DesignNode {
  const trigger = createNode('TabsTrigger', {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '7px',
    background: 'transparent',
    color: '#cdd6f4',
    fontSize: '13px',
    fontWeight: '650',
    cursor: 'pointer',
  }, [name], name)
  trigger.props.value = value
  trigger.props.class = 'vp-tabs-trigger'
  trigger.meta.source = { kind: 'library', library: 'reka-ui', component: 'Tabs', part: 'trigger' }
  return trigger
}

function createTabsContentNode(name: string, value: string, text: string): DesignNode {
  const content = createNode('TabsContent', {
    padding: '14px',
    borderRadius: '12px',
    background: 'white',
    color: '#1e1e2e',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
  }, [text], name)
  content.props.value = value
  content.meta.source = { kind: 'library', library: 'reka-ui', component: 'Tabs', part: 'content' }
  return content
}

function createAccordionNode(): DesignNode {
  const root = createNode('AccordionRoot', {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  }, [], 'Accordion')
  root.props.type = 'single'
  root.props.defaultValue = 'item-1'
  root.props.collapsible = true
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Accordion', part: 'root' }
  root.children.push(
    createAccordionItemNode('item-1', 'What can this build?', 'Real Vue components with bindings and Reka primitives.'),
    createAccordionItemNode('item-2', 'Can it export code?', 'Yes — the developer preview generates Vue SFC output.'),
  )
  return root
}

function createAccordionItemNode(value: string, title: string, content: string): DesignNode {
  const item = createNode('AccordionItem', {
    overflow: 'hidden',
    borderRadius: '12px',
    border: '1px solid #45475a',
    background: '#181825',
  }, [], title)
  item.props.value = value
  item.meta.source = { kind: 'library', library: 'reka-ui', component: 'Accordion', part: 'item' }

  const header = createNode('AccordionHeader', { margin: '0' }, [], 'Header')
  header.meta.source = { kind: 'library', library: 'reka-ui', component: 'Accordion', part: 'header' }

  const trigger = createNode('AccordionTrigger', {
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    background: 'transparent',
    color: '#cdd6f4',
    fontSize: '14px',
    fontWeight: '700',
    textAlign: 'left',
    cursor: 'pointer',
  }, [title], 'Trigger')
  trigger.meta.source = { kind: 'library', library: 'reka-ui', component: 'Accordion', part: 'trigger' }

  const contentNode = createNode('AccordionContent', {
    padding: '0 14px 14px',
    color: '#a6adc8',
    fontSize: '13px',
    lineHeight: '1.5',
  }, [content], 'Content')
  contentNode.meta.source = { kind: 'library', library: 'reka-ui', component: 'Accordion', part: 'content' }

  header.children.push(trigger)
  item.children.push(header, contentNode)
  return item
}

function createCollapsibleNode(): DesignNode {
  const root = createNode('CollapsibleRoot', {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  }, [], 'Collapsible')
  root.props.defaultOpen = true
  root.meta.source = { kind: 'library', library: 'reka-ui', component: 'Collapsible', part: 'root' }

  const trigger = createNode('CollapsibleTrigger', {
    padding: '10px 12px',
    border: 'none',
    borderRadius: '10px',
    background: '#4361ee',
    color: 'white',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  }, ['Toggle details'], 'Trigger')
  trigger.meta.source = { kind: 'library', library: 'reka-ui', component: 'Collapsible', part: 'trigger' }

  const content = createNode('CollapsibleContent', {
    padding: '14px',
    borderRadius: '12px',
    background: 'white',
    color: '#1e1e2e',
    fontSize: '13px',
    lineHeight: '1.5',
    boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
  }, ['This region can collapse in preview mode.'], 'Content')
  content.meta.source = { kind: 'library', library: 'reka-ui', component: 'Collapsible', part: 'content' }

  root.children.push(trigger, content)
  return root
}
