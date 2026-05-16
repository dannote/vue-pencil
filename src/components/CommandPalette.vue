<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface CommandItem {
  id: string
  title: string
  description?: string
  shortcut?: string
  disabled?: boolean
  run: () => void | Promise<void>
}

const props = defineProps<{
  commands: CommandItem[]
}>()

const open = defineModel<boolean>('open', { required: true })
const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement>()

const filteredCommands = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const commands = props.commands.filter(command => !command.disabled)
  if (!needle) return commands
  return commands.filter((command) => {
    return `${command.title} ${command.description ?? ''}`.toLowerCase().includes(needle)
  })
})

watch(open, async (value) => {
  if (!value) return
  query.value = ''
  selectedIndex.value = 0
  await nextTick()
  inputRef.value?.focus()
})

watch(filteredCommands, () => {
  selectedIndex.value = Math.min(selectedIndex.value, Math.max(filteredCommands.value.length - 1, 0))
})

function close() {
  open.value = false
}

async function run(command: CommandItem | undefined) {
  if (!command) return
  close()
  await command.run()
}

function onKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
    return
  }

  if (!open.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    void run(filteredCommands.value[selectedIndex.value])
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm" @pointerdown.self="close">
      <div class="mx-auto mt-24 w-[520px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[var(--vp-border-strong)] bg-[var(--vp-bg-panel)] shadow-2xl shadow-black/40">
        <div class="border-b border-[var(--vp-bg-hover)] p-3">
          <input
            ref="inputRef"
            v-model="query"
            class="w-full rounded-xl border border-[var(--vp-border-strong)] bg-[var(--vp-bg-panel-raised)] px-3 py-2.5 text-sm font-medium text-[var(--vp-text-primary)] outline-none placeholder:text-[var(--vp-text-tertiary)] focus:border-[var(--vp-accent-hover)]"
            placeholder="Search commands..."
          >
        </div>
        <div class="max-h-[360px] overflow-y-auto p-2">
          <button
            v-for="(command, index) in filteredCommands"
            :key="command.id"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
            :class="index === selectedIndex ? 'bg-[var(--vp-accent)] text-white' : 'text-[var(--vp-text-primary)] hover:bg-[var(--vp-bg-hover)]'"
            @mousemove="selectedIndex = index"
            @click="run(command)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">{{ command.title }}</span>
              <span v-if="command.description" class="mt-0.5 block truncate text-xs" :class="index === selectedIndex ? 'text-white/75' : 'text-[var(--vp-text-secondary)]'">
                {{ command.description }}
              </span>
            </span>
            <span v-if="command.shortcut" class="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold" :class="index === selectedIndex ? 'text-white/80' : 'text-[var(--vp-text-secondary)]'">
              {{ command.shortcut }}
            </span>
          </button>
          <div v-if="filteredCommands.length === 0" class="px-3 py-8 text-center text-sm text-[var(--vp-text-secondary)]">
            No commands found
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
