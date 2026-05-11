import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface Segment {
  start: number
  end: number
  word: string
}

// Module-level cache — persists for the entire session
const subtitleCache = new Map<string, Segment[]>()

export function useSubtitles(
  audioRefs: Ref<(HTMLAudioElement | null)[]>,
  getMessages: () => Record<string, string>,
) {
  const showSubtitles    = ref(false)
  const currentSubtitle  = ref<Segment | null>(null)
  let activeIndex: number | null = null
  let segments: Segment[] = []
  let pollingInterval: ReturnType<typeof setInterval> | null = null

  function getSubtitleUrl(index: number): string {
    const msgs = getMessages()
    return index === -1
      ? (msgs.subtitleIntroduction ?? '')
      : (msgs[`subtitle${index + 1}`] ?? '')
  }

  async function loadSegments(index: number): Promise<void> {
    const url = getSubtitleUrl(index)
    if (!url) { segments = []; return }
    if (subtitleCache.has(url)) {
      segments = subtitleCache.get(url)!
      return
    }
    try {
      const res = await fetch(url)
      const data = await res.json()
      segments = data.stab_segments ?? []
      subtitleCache.set(url, segments)
    } catch {
      segments = []
    }
  }

  function startPolling() {
    pollingInterval = setInterval(() => {
      const refIdx = activeIndex === -1 ? 0 : (activeIndex ?? 0) + 1
      const el = audioRefs.value[refIdx]
      if (!el) return
      const t = el.currentTime
      currentSubtitle.value = segments.find(s => t >= s.start && t < s.end) ?? null
    }, 100)
  }

  function stopPolling() {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  async function toggleSubtitles(index: number) {
    if (showSubtitles.value && activeIndex === index) {
      showSubtitles.value = false
      stopPolling()
      activeIndex = null
      return
    }
    activeIndex = index
    await loadSegments(index)
    showSubtitles.value = true
    startPolling()
  }

  function resetSubtitles() {
    showSubtitles.value  = false
    currentSubtitle.value = null
    stopPolling()
    activeIndex = null
    segments = []
  }

  onUnmounted(stopPolling)

  return { showSubtitles, currentSubtitle, toggleSubtitles, resetSubtitles }
}
