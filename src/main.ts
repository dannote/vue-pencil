import './polyfill'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './components/App.vue'
import './app.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
