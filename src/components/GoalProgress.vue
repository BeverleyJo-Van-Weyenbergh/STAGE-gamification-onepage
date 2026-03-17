<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  currentMeetings: number
  targetMeetings: number
  startAnimation: boolean
}>()

interface FireworkParticle {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  size: number
  duration: number
  delay: number
  color: string
}

const fireworkColors = ['#682577', '#e1d8ec', '#30163a', '#fcf4de', '#fde594', '#ffffff']

const defaultFireworkColor = '#682577'
const fireworkParticles = ref<FireworkParticle[]>([])

let fireworkParticleId = 0
let clearFireworkTimeout: ReturnType<typeof setTimeout> | null = null

const clearFirework = () => {
  if (clearFireworkTimeout) {
    clearTimeout(clearFireworkTimeout)
    clearFireworkTimeout = null
  }

  fireworkParticles.value = []
}

const getParticleStyle = (particle: FireworkParticle): Record<string, string> => ({
  '--firework-start-x': `${particle.startX}px`,
  '--firework-start-y': `${particle.startY}px`,
  '--firework-end-x': `${particle.endX}px`,
  '--firework-end-y': `${particle.endY}px`,
  '--firework-size': `${particle.size}px`,
  '--firework-duration': `${particle.duration}ms`,
  '--firework-delay': `${particle.delay}ms`,
  '--firework-color': particle.color,
})

const triggerFireworks = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    return
  }

  const burstCount = 4
  const particlesPerBurst = 32

  clearFirework()

  const origins: Array<{ x: number; y: number }> = [
    { x: 60, y: window.innerHeight - 40 },
    { x: window.innerWidth - 60, y: window.innerHeight - 40 },
  ]

  fireworkParticles.value = Array.from(
    { length: origins.length * burstCount * particlesPerBurst },
    (_, index) => {
      const originIndex = Math.floor(index / (burstCount * particlesPerBurst))
      const origin = origins[originIndex]!
      const burstIndex = Math.floor((index % (burstCount * particlesPerBurst)) / particlesPerBurst)
      const particleIndex = index % particlesPerBurst
      const angle = -Math.PI + (particleIndex / particlesPerBurst) * Math.PI
      const speed = 900 + Math.random() * 640
      const burstDelay = burstIndex * 80
      const gravity = 480
      const duration = 2800 + Math.random() * 800

      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed

      const flightTime = duration / 1000
      const endX = origin.x + vx * flightTime
      const endY = origin.y + vy * flightTime + 0.5 * gravity * flightTime * flightTime

      const randomColor =
        fireworkColors[Math.floor(Math.random() * fireworkColors.length)] || defaultFireworkColor

      return {
        id: fireworkParticleId++,
        startX: origin.x,
        startY: origin.y,
        endX,
        endY: Math.max(Math.min(endY, window.innerHeight + 200), -100),
        size: 5 + Math.random() * 8,
        duration,
        delay: burstDelay + Math.random() * 60,
        color: randomColor,
      }
    },
  )

  const maxLifetime = fireworkParticles.value.reduce(
    (maxLifetimeValue, particle) => Math.max(maxLifetimeValue, particle.duration + particle.delay),
    0,
  )

  clearFireworkTimeout = setTimeout(() => {
    fireworkParticles.value = []
    clearFireworkTimeout = null
  }, maxLifetime + 300)
}

const progressPercent = computed(() => {
  if (props.targetMeetings <= 0) {
    return 0
  }

  return Math.min(100, Number(((props.currentMeetings / props.targetMeetings) * 100).toFixed(1)))
})

const animatedProgressPercent = ref(0)
const isGoalComplete = computed(() => progressPercent.value >= 100)

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

  if (nextValue >= 100) {
    triggerFireworks()
  }
})

onBeforeUnmount(() => {
  clearFirework()
})
</script>

<template>
  <div class="c-goal">
    <div class="c-goal__progress card-bg">
      <p v-if="!isGoalComplete" class="c-goal__progress__text">
        <span>Maanddoel: {{ props.currentMeetings }}/{{ props.targetMeetings }} meetings</span>
        <span class="c-goal__progress__value">{{ progressPercent }}%</span>
      </p>
      <p v-else class="c-goal__progress__text">
        Maanddoel bereikt proficiat!
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

    <Teleport to="body">
      <div v-if="fireworkParticles.length > 0" class="c-goal__firework-layer" aria-hidden="true">
        <div
          v-for="particle in fireworkParticles"
          :key="particle.id"
          class="c-goal__firework-particle"
          :style="getParticleStyle(particle)"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.c-goal__firework-layer {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 9999;
}

.c-goal__firework-particle {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--firework-size);
  height: var(--firework-size);
  border-radius: 50%;
  background: var(--firework-color);
  box-shadow:
    0 0 8px var(--firework-color),
    0 0 16px color-mix(in srgb, var(--firework-color) 60%, transparent);
  opacity: 0;
  transform: translate3d(var(--firework-start-x), var(--firework-start-y), 0);
  animation: c-goal-firework-burst var(--firework-duration) ease-out forwards;
  animation-delay: var(--firework-delay);
  will-change: transform, opacity;
}

@keyframes c-goal-firework-burst {
  0% {
    opacity: 1;
    transform: translate3d(var(--firework-start-x), var(--firework-start-y), 0) scale(1);
  }

  70% {
    opacity: 0.8;
  }

  100% {
    opacity: 0;
    transform: translate3d(var(--firework-end-x), var(--firework-end-y), 0) scale(0.2);
  }
}
</style>
