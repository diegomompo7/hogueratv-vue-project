import { ref, watch } from 'vue'

export function useAudioControl(getLanguage: () => string | null) {
  const audioRefs  = ref<(HTMLAudioElement | null)[]>(new Array(7).fill(null))
  const isPlayed   = ref<boolean[]>(new Array(7).fill(false))
  const isLoading  = ref<boolean[]>(new Array(7).fill(false))
  const isError    = ref<boolean[]>(new Array(7).fill(false))

  function pauseAll() {
    audioRefs.value.forEach((el, i) => {
      if (el && !el.paused) {
        el.pause()
        isPlayed.value[i] = false
      }
    })
  }

  function controlAudio(index: number) {
    const el = audioRefs.value[index]
    if (!el) return
    if (isPlayed.value[index]) {
      el.pause()
      isPlayed.value[index] = false
    } else {
      pauseAll()
      el.play().catch(() => {
        isError.value[index] = true
        isPlayed.value[index] = false
      })
      isPlayed.value[index] = true
    }
  }

  function handleAudioEnded(index: number) {
    isPlayed.value[index] = false
  }

  function handleLoadStart(index: number) {
    isLoading.value[index] = true
    isError.value[index] = false
  }

  function handleCanPlay(index: number) {
    isLoading.value[index] = false
  }

  function handleAudioError(index: number) {
    isError.value[index] = true
    isPlayed.value[index] = false
    isLoading.value[index] = false
  }

  // Reload all audio elements when language changes (new src paths via $t)
  watch(getLanguage, () => {
    audioRefs.value.forEach((el, i) => {
      if (el) {
        el.pause()
        el.currentTime = 0
        el.load()
        isPlayed.value[i]  = false
        isLoading.value[i] = false
        isError.value[i]   = false
      }
    })
  })

  return {
    audioRefs,
    isPlayed,
    isLoading,
    isError,
    controlAudio,
    pauseAll,
    handleAudioEnded,
    handleLoadStart,
    handleCanPlay,
    handleAudioError,
  }
}
