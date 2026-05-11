<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQueryParams }   from '@/composables/useQueryParams'
import { useAudioControl }  from '@/composables/useAudioControl'
import { useSubtitles }     from '@/composables/useSubtitles'
import { useArrowNav }      from '@/composables/useArrowNav'

const props = defineProps<{
  messages: Record<string, string>
  language: string | null
}>()

// Paths as JS strings so Vite doesn't treat them as static asset imports
const videoSrc    = '/assets/video/signLanguageIntroduction.mp4'
const captionsSrc = '/captions/signLanguageIntroduction.vtt'

const { t } = useI18n()
const { initScene } = useQueryParams()
const { register, focusKey } = useArrowNav()

const {
  audioRefs,
  isPlayed, isLoading, isError,
  controlAudio, pauseAll,
  handleAudioEnded, handleLoadStart, handleCanPlay, handleAudioError,
} = useAudioControl(() => props.language)

const {
  showSubtitles, currentSubtitle,
  toggleSubtitles, resetSubtitles,
} = useSubtitles(audioRefs, () => props.messages)

// ── Scene carousel state ──────────────────────────────────
const currentSlide = ref(Math.max(0, initScene.value))
const sceneKey = computed(() => ((5 + currentSlide.value) % 5) + 1)

function navigatePrev() {
  currentSlide.value = (currentSlide.value - 1 + 5) % 5
  pauseAll()
  resetSubtitles()
  nextTick(() => focusKey('scene-audio'))
}

function navigateNext() {
  currentSlide.value = (currentSlide.value + 1) % 5
  pauseAll()
  resetSubtitles()
  nextTick(() => focusKey('scene-audio'))
}

// ── Audio ended: also reset subtitles ────────────────────
function onAudioEnded(index: number) {
  handleAudioEnded(index)
  resetSubtitles()
}

// ── Screen transitions: reset state ─────────────────────
// No manual focus needed — autoFocus=true on each screen's first button handles it.
watch(initScene, () => {
  pauseAll()
  resetSubtitles()
})

// ── Audio button label ────────────────────────────────────
function audioLabel(index: number): string {
  if (isError.value[index])   return props.messages.audioError   ?? 'Error'
  if (isLoading.value[index]) return props.messages.audioLoading ?? '…'
  if (isPlayed.value[index])  return props.messages.pauseAudio   ?? '⏸'
  return index === 0
    ? (props.messages.audioGuide ?? '▶')
    : (props.messages.playAudio  ?? '▶')
}

// ── Template ref helper (avoids auto-unwrap issue) ───────
function setAudioRef(index: number) {
  return (el: unknown) => { audioRefs.value[index] = el as HTMLAudioElement | null }
}

// ── Navigation: "Escenes" button on intro ─────────────────
function goToScenes() {
  initScene.value = 0
  currentSlide.value = 0
}

function goToSignLanguage() {
  initScene.value = 6
}

function goToIntro() {
  initScene.value = -1
}
</script>

<template>
  <!-- ═══════════════════════════════════════════════════════
       Hidden audio elements — always in DOM, language-aware
  ════════════════════════════════════════════════════════ -->
  <audio
    :ref="setAudioRef(0)"
    preload="none"
    id="audioPlayerIntroduction"
    @loadstart="handleLoadStart(0)"
    @canplay="handleCanPlay(0)"
    @ended="onAudioEnded(0)"
    @error="handleAudioError(0)"
  >
    <source :src="t('audioIntroduction')" type="audio/mpeg">
  </audio>

  <audio
    v-for="i in 5"
    :key="i"
    :ref="setAudioRef(i)"
    preload="none"
    :id="`audioPlayer${i}`"
    @loadstart="handleLoadStart(i)"
    @canplay="handleCanPlay(i)"
    @ended="onAudioEnded(i)"
    @error="handleAudioError(i)"
  >
    <source :src="t(`audio${i}`)" type="audio/mpeg">
  </audio>

  <!-- ═══════════════════════════════════════════════════════
       SCREEN 1 — Introduction
  ════════════════════════════════════════════════════════ -->
  <main
    v-if="initScene === -1"
    class="screen screen--intro"
    id="main-content"
    role="main"
    aria-label="Introducció"
  >
    <h1 class="scene-title">{{ messages.introduction }}</h1>

    <div class="audio-controls">
      <button
        :ref="(el) => register(el as HTMLElement, 'intro-audio', true)"
        class="btn-audio"
        :class="{ 'is-loading': isLoading[0], 'is-error': isError[0] }"
        :disabled="isLoading[0] || isError[0]"
        :aria-label="audioLabel(0)"
        @click="controlAudio(0)"
      >
        <span class="btn-audio__icon">{{ isPlayed[0] ? '⏸' : '▶' }}</span>
        {{ audioLabel(0) }}
      </button>

      <button
        :ref="(el) => register(el as HTMLElement, 'intro-subtitle')"
        class="btn-audio btn-audio--secondary"
        :aria-pressed="showSubtitles"
        @click="toggleSubtitles(-1)"
      >
        {{ showSubtitles ? messages.disableSubtitle : messages.enableSubtitle }}
      </button>

      <button
        :ref="(el) => register(el as HTMLElement, 'intro-scenes')"
        class="btn-audio"
        @click="goToScenes"
      >
        ▷ Escenes
      </button>

      <button
        :ref="(el) => register(el as HTMLElement, 'intro-sign')"
        class="btn-audio btn-audio--sign"
        @click="goToSignLanguage"
      >
        {{ messages.signLanguageButton }}
      </button>
    </div>
  </main>

  <!-- ═══════════════════════════════════════════════════════
       SCREEN 2 — Scene carousel (0–4)
  ════════════════════════════════════════════════════════ -->
  <main
    v-else-if="initScene >= 0 && initScene <= 4"
    class="screen screen--scenes"
    id="main-content"
    role="main"
    :aria-label="`${messages[`scene${sceneKey}`]}`"
  >
    <!-- Scene navigation row -->
    <div class="scene-nav">
      <button
        :ref="(el) => register(el as HTMLElement, 'scene-prev')"
        class="scene-nav__btn"
        :aria-label="messages.previousScene"
        @click="navigatePrev"
      >‹</button>

      <div class="scene-nav__center">
        <h1 class="scene-title" :key="sceneKey">
          {{ messages[`scene${sceneKey}`] }}
        </h1>
        <span class="scene-counter" aria-live="polite">
          {{ sceneKey }} / 5
        </span>
      </div>

      <button
        :ref="(el) => register(el as HTMLElement, 'scene-next')"
        class="scene-nav__btn"
        :aria-label="messages.nextScene"
        @click="navigateNext"
      >›</button>
    </div>

    <!-- Audio controls -->
    <div class="audio-controls">
      <button
        :ref="(el) => register(el as HTMLElement, 'scene-audio', true)"
        class="btn-audio"
        :class="{ 'is-loading': isLoading[sceneKey], 'is-error': isError[sceneKey] }"
        :disabled="isLoading[sceneKey] || isError[sceneKey]"
        :aria-label="audioLabel(sceneKey)"
        :aria-controls="`audioPlayer${sceneKey}`"
        @click="controlAudio(sceneKey)"
      >
        <span class="btn-audio__icon">{{ isPlayed[sceneKey] ? '⏸' : '▶' }}</span>
        {{ audioLabel(sceneKey) }}
      </button>

      <button
        :ref="(el) => register(el as HTMLElement, 'scene-subtitle')"
        class="btn-audio btn-audio--secondary"
        :aria-pressed="showSubtitles"
        @click="toggleSubtitles(currentSlide)"
      >
        {{ showSubtitles ? messages.disableSubtitle : messages.enableSubtitle }}
      </button>
    </div>

    <!-- Dot indicator -->
    <div class="dots" role="none" aria-hidden="true">
      <span
        v-for="i in 5"
        :key="i"
        class="dot"
        :class="{ 'dot--active': i === sceneKey }"
      />
    </div>

    <!-- Back to intro -->
    <button
      :ref="(el) => register(el as HTMLElement, 'scene-back')"
      class="btn-back"
      @click="goToIntro"
    >
      ← {{ messages.backToIntro }}
    </button>
  </main>

  <!-- ═══════════════════════════════════════════════════════
       SCREEN 3 — Sign language video
  ════════════════════════════════════════════════════════ -->
  <main
    v-else
    class="screen screen--sign"
    id="main-content"
    role="main"
    :aria-label="messages.signLanguage"
  >
    <h1 class="scene-title">{{ messages.signLanguage }}</h1>

    <video
      class="sign-video"
      controls
      playsinline
      preload="metadata"
      :src="videoSrc"
    >
      <track
        kind="captions"
        :src="captionsSrc"
        default
      >
    </video>

    <button
      :ref="(el) => register(el as HTMLElement, 'sign-back', true)"
      class="btn-back"
      @click="goToIntro"
    >
      ← {{ messages.backToIntro }}
    </button>
  </main>

  <!-- ═══════════════════════════════════════════════════════
       Subtitles bar — fixed bottom, all screens
  ════════════════════════════════════════════════════════ -->
  <Transition name="subtitle-fade">
    <div
      v-if="showSubtitles && currentSubtitle"
      class="subtitles-bar"
      role="status"
      aria-live="polite"
    >
      {{ currentSubtitle.word }}
    </div>
  </Transition>
</template>

<style scoped>
/* ── Screen shell ──────────────────────────────────────── */
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1.5rem, 3vh, 3rem);
  padding: clamp(2rem, 4vw, 5rem);
  overflow: hidden;
}

/* ── Scene title ───────────────────────────────────────── */
.scene-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-accent);
  text-align: center;
  line-height: 1.15;
  letter-spacing: -0.02em;
  animation: titleIn 0.3s ease forwards;
}

@keyframes titleIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .scene-title { animation: none; }
}

/* ── Audio controls ────────────────────────────────────── */
.audio-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 2vh, 1.75rem);
}

/* ── Primary button ────────────────────────────────────── */
.btn-audio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-width: clamp(240px, 28vw, 420px);
  min-height: clamp(56px, 7vh, 80px);
  padding: 0 clamp(1.5rem, 3vw, 2.5rem);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: 600;
  background: var(--color-bg);
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-full);
  box-shadow: var(--glow-sm);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.btn-audio:hover {
  background: var(--color-accent);
  color: #000;
  box-shadow: var(--glow-md);
  transform: translateY(-3px);
}

.btn-audio:active {
  transform: scale(0.97);
  box-shadow: var(--glow-sm);
}

.btn-audio:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-audio.is-loading {
  animation: pulse 1.4s ease-in-out infinite;
  pointer-events: none;
  opacity: 0.75;
}

.btn-audio.is-error {
  border-color: var(--color-error);
  color: var(--color-error);
  box-shadow: var(--glow-error);
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { box-shadow: var(--glow-sm); }
  50%       { box-shadow: var(--glow-lg); }
}

@media (prefers-reduced-motion: reduce) {
  .btn-audio.is-loading { animation: none; }
}

.btn-audio__icon {
  font-size: 1.1em;
}

/* ── Secondary button ──────────────────────────────────── */
.btn-audio--secondary {
  min-width: clamp(200px, 22vw, 340px);
  min-height: clamp(48px, 6vh, 64px);
  font-size: var(--text-base);
  font-weight: 400;
  border-width: 1px;
  box-shadow: none;
  opacity: 0.82;
}

/* ── Sign language button ──────────────────────────────── */
.btn-audio--sign {
  border-color: rgba(255, 215, 0, 0.5);
  opacity: 0.9;
}

/* ── Scene navigation row ──────────────────────────────── */
.scene-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(2rem, 5vw, 6rem);
  width: 100%;
}

.scene-nav__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 60vw;
}

.scene-nav__btn {
  width:  clamp(64px, 7vw, 96px);
  height: clamp(64px, 7vw, 96px);
  background: transparent;
  color: var(--color-accent);
  border: 2px solid var(--color-accent-dim);
  border-radius: 50%;
  font-size: clamp(2rem, 3.5vw, 3.5rem);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}

.scene-nav__btn:hover {
  background: rgba(255, 215, 0, 0.12);
  border-color: var(--color-accent);
  box-shadow: var(--glow-sm);
}

.scene-counter {
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

/* ── Dot indicator ─────────────────────────────────────── */
.dots {
  display: flex;
  gap: 0.75rem;
}

.dot {
  width: clamp(10px, 1.2vw, 16px);
  height: clamp(10px, 1.2vw, 16px);
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.25);
  transition: background var(--transition-base);
}

.dot--active {
  background: var(--color-accent);
  box-shadow: var(--glow-sm);
}

/* ── Back button ───────────────────────────────────────── */
.btn-back {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.btn-back:hover {
  color: var(--color-accent);
  border-color: var(--color-accent-dim);
}

/* ── Sign language screen ──────────────────────────────── */
.screen--sign {
  gap: clamp(1.5rem, 3vh, 3rem);
}

.sign-video {
  width: min(70vw, 80vh * 1.78);
  max-height: 60vh;
  border-radius: var(--radius-lg);
  border: 2px solid rgba(255, 215, 0, 0.2);
  background: #000;
}

/* ── Subtitles bar ─────────────────────────────────────── */
.subtitles-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: clamp(0.75rem, 1.5vh, 1.25rem) clamp(3rem, 8vw, 8rem);
  background: rgba(0, 0, 0, 0.82);
  border-top: 1px solid rgba(255, 215, 0, 0.18);
  text-align: center;
  font-size: var(--text-xl);
  font-weight: 400;
  color: var(--color-accent);
  line-height: 1.4;
  z-index: 50;
}

.subtitle-fade-enter-active,
.subtitle-fade-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.subtitle-fade-enter-from,
.subtitle-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
