<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  meetingsToday: number
  activeUsers: number
  meetingsThisMonth: number
  startAnimation: boolean
}>()

const emit = defineEmits<{
  (event: 'animation-complete'): void
}>()

const statsCardsVisible = ref([false, false, false])
const statsAnimationTimeouts: number[] = []
let hasStartedAnimation = false

const clearAnimationTimeouts = () => {
  statsAnimationTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId)
  })

  statsAnimationTimeouts.length = 0
}

const runStatsAnimation = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    statsCardsVisible.value = [true, true, true]
    emit('animation-complete')
    return
  }

  const baseDelayMs = 120
  const stepDelayMs = 180
  const cardRevealDurationMs = 420

  statsCardsVisible.value.forEach((_, index) => {
    const timeoutId = window.setTimeout(
      () => {
        statsCardsVisible.value[index] = true
      },
      baseDelayMs + stepDelayMs * index,
    )

    statsAnimationTimeouts.push(timeoutId)
  })

  const totalDelayMs =
    baseDelayMs + stepDelayMs * (statsCardsVisible.value.length - 1) + cardRevealDurationMs

  const completionTimeoutId = window.setTimeout(() => {
    emit('animation-complete')
  }, totalDelayMs)

  statsAnimationTimeouts.push(completionTimeoutId)
}

watch(
  () => props.startAnimation,
  (shouldStart) => {
    if (!shouldStart || hasStartedAnimation) {
      return
    }

    hasStartedAnimation = true
    runStatsAnimation()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearAnimationTimeouts()
})
</script>

<template>
  <div class="c-statistics">
    <div class="c-statistics__card card-bg" :class="{ 'is-visible': statsCardsVisible[0] }">
      <h2 class="c-statistics__title">Meetings vandaag</h2>
      <div class="c-statistics__text">
        <p class="c-statistics__nr">{{ props.meetingsToday }}</p>
        <p class="c-statistics__subtext">Over alle kantoren</p>
      </div>
    </div>
    <div class="c-statistics__card card-bg" :class="{ 'is-visible': statsCardsVisible[1] }">
      <h2 class="c-statistics__title">Actieve gebruikers</h2>
      <div class="c-statistics__text">
        <p class="c-statistics__nr">{{ props.activeUsers }}</p>
        <p class="c-statistics__subtext">Actieve gebruikers vandaag</p>
      </div>
    </div>
    <div class="c-statistics__card card-bg" :class="{ 'is-visible': statsCardsVisible[2] }">
      <h2 class="c-statistics__title">Meetings deze maand</h2>
      <div class="c-statistics__text">
        <p class="c-statistics__nr">{{ props.meetingsThisMonth }}</p>
        <p class="c-statistics__subtext">Bedrijfsbreed</p>
      </div>
    </div>
  </div>
</template>
