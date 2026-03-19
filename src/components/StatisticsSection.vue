<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  meetingsToday: number
  activeUsers: number
  meetingsThisMonth: number
  startAnimation: boolean
}>()

const emit = defineEmits<{
  (event: 'animation-complete'): void
}>()

interface MeetingsPerMonthApiEntry {
  month?: string
  meeting_count?: number
}

interface MeetingsPerMonthResponse {
  months?: MeetingsPerMonthApiEntry[]
}

interface OfficesResponse {
  offices?: unknown[]
}

interface MonthlyMeeting {
  month: string
  meeting_count: number
}

const statsCardsVisible = ref([false, false, false, false])
const monthlyMeetings = ref<MonthlyMeeting[]>([])
const showMiniGraph = ref(true)
const statsAnimationTimeouts: number[] = []
let hasStartedAnimation = false
let monthlyMeetingsInterval: ReturnType<typeof setInterval> | null = null

const chartWidth = 300
const chartHeight = 96
const chartPaddingX = 12
const chartPaddingY = 10
const chartLabelTopPadding = 15

const formatMonthLabel = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return monthKey
  }

  return new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(date)
}

const fetchOfficesVisibility = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/offices')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: OfficesResponse = await response.json()
    const offices = Array.isArray(data.offices) ? data.offices : []
    showMiniGraph.value = offices.length > 1
  } catch (error) {
    console.error('Failed to determine statistics graph visibility:', error)
    showMiniGraph.value = true
  }
}

const fetchMeetingsPerMonth = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/stats/meetings-per-month')
    if (!response.ok) {
      throw new Error('Failed to fetch meetings per month')
    }

    const data: MeetingsPerMonthResponse = await response.json()
    const months = Array.isArray(data.months) ? data.months : []

    monthlyMeetings.value = months
      .filter((entry): entry is MonthlyMeeting => {
        return typeof entry.month === 'string' && typeof entry.meeting_count === 'number'
      })
      .sort((entryA, entryB) => entryA.month.localeCompare(entryB.month))
      .slice(-6)
  } catch (error) {
    console.error('Failed to fetch meetings per month:', error)
  }
}

interface ChartPoint {
  x: number
  y: number
  month: string
  value: number
}

const chartPoints = computed<ChartPoint[]>(() => {
  if (monthlyMeetings.value.length === 0) {
    return []
  }

  const values = monthlyMeetings.value.map((item) => item.meeting_count)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue
  const plotWidth = chartWidth - chartPaddingX * 2
  const plotBottomY = chartHeight - chartPaddingY - chartLabelTopPadding
  const plotHeight = plotBottomY - chartPaddingY
  const stepX =
    monthlyMeetings.value.length > 1 ? plotWidth / (monthlyMeetings.value.length - 1) : 0

  return monthlyMeetings.value.map((item, index) => {
    const x = chartPaddingX + stepX * index
    const normalizedY = range === 0 ? 0.5 : (item.meeting_count - minValue) / Math.max(range, 1)
    const y = chartPaddingY + plotHeight * (1 - normalizedY)

    return {
      x,
      y,
      month: item.month,
      value: item.meeting_count,
    }
  })
})

const chartLinePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return ''
  }

  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const chartAreaPath = computed(() => {
  if (chartPoints.value.length === 0) {
    return ''
  }

  const firstPoint = chartPoints.value[0]
  const lastPoint = chartPoints.value[chartPoints.value.length - 1]

  if (!firstPoint || !lastPoint) {
    return ''
  }

  const plotBottomY = chartHeight - chartPaddingY - chartLabelTopPadding

  return `${chartLinePath.value} L ${lastPoint.x} ${plotBottomY} L ${firstPoint.x} ${plotBottomY} Z`
})

const clearAnimationTimeouts = () => {
  statsAnimationTimeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId)
  })

  statsAnimationTimeouts.length = 0
}

const runStatsAnimation = () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cardsToAnimate = showMiniGraph.value ? 4 : 3

  if (reducedMotion) {
    statsCardsVisible.value = [true, true, true, showMiniGraph.value]
    emit('animation-complete')
    return
  }

  const baseDelayMs = 120
  const stepDelayMs = 180
  const cardRevealDurationMs = 420

  Array.from({ length: cardsToAnimate }, (_, index) => index).forEach((index) => {
    const timeoutId = window.setTimeout(
      () => {
        statsCardsVisible.value[index] = true
      },
      baseDelayMs + stepDelayMs * index,
    )

    statsAnimationTimeouts.push(timeoutId)
  })

  const totalDelayMs = baseDelayMs + stepDelayMs * (cardsToAnimate - 1) + cardRevealDurationMs

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

  if (monthlyMeetingsInterval) {
    clearInterval(monthlyMeetingsInterval)
    monthlyMeetingsInterval = null
  }
})

onMounted(() => {
  void fetchOfficesVisibility().then(() => {
    if (!showMiniGraph.value) {
      return
    }

    void fetchMeetingsPerMonth()

    monthlyMeetingsInterval = setInterval(() => {
      void fetchMeetingsPerMonth()
    }, 60000)
  })
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
    <div
      v-if="showMiniGraph"
      class="c-statistics__card card-bg"
      :class="{ 'is-visible': statsCardsVisible[3] }"
    >
      <h2 class="c-statistics__title">Laatste 6 maanden</h2>
      <div v-if="chartPoints.length > 0" class="c-statistics__graph">
        <svg
          class="c-statistics__graph-svg"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          role="img"
          aria-label="Meetings van de laatste 6 maanden"
        >
          <path class="c-statistics__graph-area" :d="chartAreaPath" />
          <path class="c-statistics__graph-line" :d="chartLinePath" />
          <circle
            v-for="point in chartPoints"
            :key="point.month"
            class="c-statistics__graph-point"
            :cx="point.x"
            :cy="point.y"
            r="3"
          >
            <title>{{ `${formatMonthLabel(point.month)}: ${point.value}` }}</title>
          </circle>
          <text
            v-for="point in chartPoints"
            :key="`${point.month}-label`"
            class="c-statistics__graph-label"
            :x="point.x"
            :y="chartHeight - 2"
            text-anchor="middle"
          >
            {{ formatMonthLabel(point.month) }}
          </text>
        </svg>
      </div>
      <p v-else class="c-statistics__subtext">Geen maandgegevens beschikbaar.</p>
    </div>
  </div>
</template>
