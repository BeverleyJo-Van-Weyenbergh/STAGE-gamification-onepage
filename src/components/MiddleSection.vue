<script setup lang="ts">
import MapboxWorldMap from '@/components/MapboxWorldMap.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  rotationTick: number
}>()

interface TopUser {
  rank: number
  name: string
  meeting_count: number
}

interface SpotlightUser {
  name: string
  meeting_count: number
}

interface TrendingUser {
  name: string
  growth: number
}

interface TopOffice {
  name: string
  meeting_count: number
}

interface TrendingOffice {
  name: string
  growth: number
}

interface StatsResponse {
  top_users?: TopUser[]
  spotlight_user?: SpotlightUser
  trending_user?: TrendingUser
  top_office?: TopOffice
  trending_office?: TrendingOffice
}

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

interface MonthlyMeetingPoint {
  month: string
  meeting_count: number
}

interface HighlightItem {
  kind: 'user' | 'office'
  name: string
  subtext: string
  trend: string
}

const topUsers = ref<TopUser[]>([])
const highlights = ref<HighlightItem[]>([])
const currentHighlightIndex = ref(0)
const activeMapTab = ref<'offices' | 'graph'>('offices')
const hasMultipleOffices = ref(true)
const monthlyMeetings = ref<MonthlyMeetingPoint[]>([])
let monthlyMeetingsInterval: ReturnType<typeof setInterval> | null = null
let compactGraphMediaQuery: MediaQueryList | null = null
const isCompactGraph = ref(false)

const updateCompactGraphMode = () => {
  isCompactGraph.value = compactGraphMediaQuery?.matches ?? false
}

const graphWidth = computed(() => (isCompactGraph.value ? 760 : 1200))
const graphHeight = computed(() => (isCompactGraph.value ? 380 : 260))
const graphPaddingTop = computed(() => (isCompactGraph.value ? 28 : 18))
const graphPaddingRight = computed(() => (isCompactGraph.value ? 26 : 20))
const graphPaddingBottom = computed(() => (isCompactGraph.value ? 76 : 52))
const graphPaddingLeft = computed(() => (isCompactGraph.value ? 52 : 44))
const graphPlotWidth = computed(
  () => graphWidth.value - graphPaddingLeft.value - graphPaddingRight.value,
)
const graphPlotHeight = computed(
  () => graphHeight.value - graphPaddingTop.value - graphPaddingBottom.value,
)

const shouldShowMonthLabel = (index: number, total: number) => {
  if (!isCompactGraph.value || total <= 3) {
    return true
  }

  const middleIndex = Math.round((total - 1) / 2)
  return index === 0 || index === middleIndex || index === total - 1
}

const fallbackHighlight: HighlightItem = {
  kind: 'office',
  name: 'Geen data beschikbaar',
  subtext: 'Over de hele wereld',
  trend: '',
}

const currentHighlight = computed(
  () => highlights.value[currentHighlightIndex.value] ?? fallbackHighlight,
)

const formatMonthLabel = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return monthKey
  }

  return new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(date)
}

const getRankIcon = (rank: number) => {
  if (rank === 1) {
    return 'crown'
  }

  if (rank === 2) {
    return 'electric_bolt'
  }

  return 'kid_star'
}

const fetchOfficesVisibility = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/offices')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: OfficesResponse = await response.json()
    const offices = Array.isArray(data.offices) ? data.offices : []

    hasMultipleOffices.value = offices.length > 1

    if (!hasMultipleOffices.value) {
      activeMapTab.value = 'graph'
    }
  } catch (error) {
    console.error('Failed to determine offices visibility:', error)
    hasMultipleOffices.value = true
  }
}

const fetchMiddleSectionData = async () => {
  try {
    const res = await fetch(`https://stats.claritalk.com/stats?t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as StatsResponse

    topUsers.value = data.top_users || []

    highlights.value = [
      data.spotlight_user
        ? {
            kind: 'user',
            name: data.spotlight_user.name,
            subtext: 'Meeste meetings deze maand',
            trend: `${data.spotlight_user.meeting_count} meetings`,
          }
        : null,
      data.trending_user
        ? {
            kind: 'user',
            name: data.trending_user.name,
            subtext: 'Sterkste groei',
            trend: `+ ${data.trending_user.growth} meetings deze week`,
          }
        : null,
      data.top_office
        ? {
            kind: 'office',
            name: data.top_office.name,
            subtext: 'Meeste meetings deze maand',
            trend: `${data.top_office.meeting_count} meetings`,
          }
        : null,
      data.trending_office
        ? {
            kind: 'office',
            name: data.trending_office.name,
            subtext: 'Sterkste groei',
            trend: `+${data.trending_office.growth} meetings deze week`,
          }
        : null,
    ].filter((item): item is HighlightItem => item !== null)

    currentHighlightIndex.value = 0
  } catch (err) {
    console.error('Failed to fetch middle section data:', err)
  }
}

const fetchMeetingsPerMonth = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/stats/meetings-per-month')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: MeetingsPerMonthResponse = await response.json()
    const months = Array.isArray(data.months) ? data.months : []

    monthlyMeetings.value = months
      .filter((entry): entry is MonthlyMeetingPoint => {
        return typeof entry.month === 'string' && typeof entry.meeting_count === 'number'
      })
      .sort((entryA, entryB) => entryA.month.localeCompare(entryB.month))
      .slice(-6)
  } catch (error) {
    console.error('Failed to fetch meetings-per-month:', error)
  }
}

const chartScaleMax = computed(() => {
  const maxValue = monthlyMeetings.value.reduce(
    (highestValue, point) => Math.max(highestValue, point.meeting_count),
    0,
  )
  const tickStep = Math.max(1, Math.ceil(Math.max(maxValue, 1) / 4))
  return tickStep * 4
})

interface ChartPoint {
  month: string
  meeting_count: number
  x: number
  y: number
}

const chartPoints = computed<ChartPoint[]>(() => {
  if (monthlyMeetings.value.length === 0) {
    return []
  }

  const pointCount = monthlyMeetings.value.length
  const stepX = pointCount > 1 ? graphPlotWidth.value / (pointCount - 1) : 0

  return monthlyMeetings.value.map((meeting, index) => {
    const x =
      pointCount === 1
        ? graphPaddingLeft.value + graphPlotWidth.value / 2
        : graphPaddingLeft.value + stepX * index

    return {
      month: meeting.month,
      meeting_count: meeting.meeting_count,
      x,
      y:
        graphPaddingTop.value +
        graphPlotHeight.value -
        (meeting.meeting_count / chartScaleMax.value) * graphPlotHeight.value,
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

  const bottomY = graphPaddingTop.value + graphPlotHeight.value

  return `${chartLinePath.value} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`
})

watch(
  () => props.rotationTick,
  () => {
    if (highlights.value.length <= 1) {
      return
    }

    currentHighlightIndex.value = (currentHighlightIndex.value + 1) % highlights.value.length
  },
)

onMounted(() => {
  compactGraphMediaQuery = window.matchMedia('(max-width: 768px)')
  updateCompactGraphMode()
  compactGraphMediaQuery.addEventListener('change', updateCompactGraphMode)

  void fetchOfficesVisibility()
  void fetchMiddleSectionData()
  void fetchMeetingsPerMonth()

  monthlyMeetingsInterval = setInterval(() => {
    void fetchMeetingsPerMonth()
  }, 60000)
})

onBeforeUnmount(() => {
  if (compactGraphMediaQuery) {
    compactGraphMediaQuery.removeEventListener('change', updateCompactGraphMode)
    compactGraphMediaQuery = null
  }

  if (monthlyMeetingsInterval) {
    clearInterval(monthlyMeetingsInterval)
    monthlyMeetingsInterval = null
  }
})
</script>

<template>
  <div class="c-middlesection">
    <div class="c-map-container">
      <div class="c-map card-bg">
        <div v-if="hasMultipleOffices" class="c-map__tabs" role="tablist" aria-label="Kantoren en graph">
          <button
            class="c-map__tab"
            :class="{ 'is-active': activeMapTab === 'offices' }"
            type="button"
            role="tab"
            :aria-selected="activeMapTab === 'offices'"
            @click="activeMapTab = 'offices'"
          >
            Kantoren
          </button>
          <button
            class="c-map__tab"
            :class="{ 'is-active': activeMapTab === 'graph' }"
            type="button"
            role="tab"
            :aria-selected="activeMapTab === 'graph'"
            @click="activeMapTab = 'graph'"
          >
            6 maanden grafiek
          </button>
        </div>

        <div
          v-if="hasMultipleOffices && activeMapTab === 'offices'"
          class="c-map__panel c-map__panel--offices"
        >
          <MapboxWorldMap />
        </div>

        <div
          v-else
          class="c-map__panel c-map__panel--graph"
          :class="{ 'c-map__panel--graph-only': !hasMultipleOffices }"
        >
          <h3 class="c-map__graph-title">Meetings per maand</h3>
          <p class="c-map__graph-subtitle">Laatste 6 maanden</p>

          <div v-if="chartPoints.length > 0" class="c-map__graph">
            <svg
              class="c-map__graph-svg"
              :viewBox="`0 0 ${graphWidth} ${graphHeight}`"
              role="img"
              aria-label="Gedetailleerde meetingtrend van de laatste 6 maanden"
            >
              <path class="c-map__graph-area" :d="chartAreaPath" />
              <path class="c-map__graph-line" :d="chartLinePath" />

              <g v-for="(point, index) in chartPoints" :key="point.month">
                <circle class="c-map__graph-point" :cx="point.x" :cy="point.y" r="4" />
                <text
                  class="c-map__graph-value"
                  :x="point.x"
                  :y="point.y - (isCompactGraph ? 12 : 10)"
                  text-anchor="middle"
                >
                  {{ point.meeting_count }}
                </text>
                <text
                  v-if="shouldShowMonthLabel(index, chartPoints.length)"
                  class="c-map__graph-month"
                  :x="point.x"
                  :y="graphHeight - (isCompactGraph ? 20 : 14)"
                  text-anchor="middle"
                >
                  {{ formatMonthLabel(point.month) }}
                </text>
              </g>
            </svg>
          </div>

          <p v-else class="c-map__graph-empty">Geen maandelijkse meetingdata beschikbaar.</p>
        </div>
      </div>
    </div>
    <div class="c-stats">
      <div class="c-stats__office card-bg--light">
        <Transition name="highlight-rotate" mode="out-in">
          <div :key="currentHighlightIndex" class="c-stats__office__content">
            <h2 class="c-stats__office__title">
              {{
                currentHighlight.kind === 'user' ? 'Gebruiker in de kijker' : 'Kantoor in de kijker'
              }}
            </h2>
            <p class="c-stats__office__name">{{ currentHighlight.name }}</p>
            <p class="c-stats__office__subtext">{{ currentHighlight.subtext }}</p>
            <p class="c-stats__office__trend">{{ currentHighlight.trend }}</p>
          </div>
        </Transition>
      </div>
      <div class="c-stats__users card-bg">
        <h2 class="c-stats__title">Top gebruikers</h2>
        <ul class="c-stats__users__list">
          <li v-for="user in topUsers" :key="user.rank" class="c-stats__users__item">
            <div class="c-stats__users__name">
              <p class="c-stats__users__nr">{{ user.rank }}</p>
              <p>{{ user.name }}</p>
            </div>
            <span class="material-symbols-outlined c-stats__users__icon" aria-hidden="true">
              {{ getRankIcon(user.rank) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
