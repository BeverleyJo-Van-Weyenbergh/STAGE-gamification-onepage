<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  currentMeetings: number
  targetMeetings: number
  startAnimation: boolean
}>()

const progressPercent = computed(() => {
  if (props.targetMeetings <= 0) {
    return 0
  }

  return Math.min(100, Number(((props.currentMeetings / props.targetMeetings) * 100).toFixed(1)))
})

const animatedProgressPercent = ref(0)

const setProgressTarget = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    animatedProgressPercent.value = progressPercent.value
    return
  }

  requestAnimationFrame(() => {
    animatedProgressPercent.value = progressPercent.value
  })
}

watch(
  () => props.startAnimation,
  (shouldStart) => {
    if (!shouldStart) {
      animatedProgressPercent.value = 0
      return
    }

    setProgressTarget()
  },
  { immediate: true },
)

watch(progressPercent, (nextValue) => {
  if (props.startAnimation) {
    animatedProgressPercent.value = nextValue
  }
})
</script>

<template>
  <div class="c-goal">
    <div class="c-goal__progress card-bg">
      <p class="c-goal__progress__text">
        <span>Maanddoel: {{ props.currentMeetings }}/{{ props.targetMeetings }} meetings</span>
        <span class="c-goal__progress__value">{{ progressPercent }}%</span>
      </p>
      <div
        class="c-goal__progress__bar"
        role="progressbar"
        aria-label="Meetingdoel deze maand"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(animatedProgressPercent)"
        :aria-valuetext="`${props.currentMeetings} van ${props.targetMeetings} meetings`"
      >
        <div class="c-goal__progress__fill" :style="{ width: `${animatedProgressPercent}%` }"></div>
      </div>
    </div>
  </div>
</template>
