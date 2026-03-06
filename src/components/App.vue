<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDocumentStore } from '@/model/document'
import Toolbar from './Toolbar.vue'
import LayerPanel from './LayerPanel.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import Canvas from './Canvas.vue'

const store = useDocumentStore()
const canvasRef = ref<InstanceType<typeof Canvas>>()
const activeTool = ref('select')

const zoom = ref(1)

function onTool(name: string) {
  activeTool.value = name
}

onMounted(() => {
  // Demo content
  const card = store.addFrame(80, 60, 320, 280, {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  })

  store.addChild(card.id, 'h1', {
    margin: '0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e1e2e',
  }, ['Hello WebCore'], undefined, 'Heading')

  store.addChild(card.id, 'p', {
    margin: '0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  }, ['Real Vue components on an infinite canvas — VNode tree in, .vue SFC out.'], undefined, 'Description')

  store.addChild(card.id, 'button', {
    padding: '10px 20px',
    background: '#4361ee',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  }, ['Click me'], undefined, 'Button')

  const gradient = store.addFrame(500, 60, 300, 200, {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontFamily: '-apple-system, sans-serif',
    fontSize: '20px',
    fontWeight: '600',
  })

  store.addChild(gradient.id, 'span', {}, ['CSS Gradient Box'], undefined, 'Label')

  store.addFrame(500, 300, 120, 120, {
    background: '#ff6b6b',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
  })
})
</script>

<template>
  <Toolbar :zoom="zoom" :active-tool="activeTool" @tool="onTool" />
  <LayerPanel :frames="store.frames" />
  <Canvas ref="canvasRef" />
  <PropertiesPanel />
</template>
