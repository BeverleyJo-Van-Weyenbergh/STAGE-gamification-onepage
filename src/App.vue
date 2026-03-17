<script setup lang="ts">
import AppBackground from '@/components/AppBackground.vue'
import companyLogo from '@/assets/Icon.png'
import DashboardHeader from '@/components/DashboardHeader.vue'
import FeedSection from '@/components/FeedSection.vue'
import GoalProgress from '@/components/GoalProgress.vue'
import MiddleSection from '@/components/MiddleSection.vue'
import PageLoader from '@/components/PageLoader.vue'
import StatisticsSection from '@/components/StatisticsSection.vue'
import { officeDatabase } from '@/data/offices'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface StatsApiResponse {
  organisation?: string
  meetings_today: number
  active_users_today: number
  meetings_this_month: number
  monthly_goal: number
  top_users?: Array<{
    rank: number
    name: string
    meetings_attended: number
  }>
}
const stats = ref<StatsApiResponse>({
  meetings_today: 0,
  active_users_today: 0,
  meetings_this_month: 0,
  monthly_goal: 500,
})

const fetchStats = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/stats')
    if (!response.ok) throw new Error('Failed to fetch stats')
    stats.value = await response.json()
    console.log('Stats fetched:', stats.value)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  } finally {
    isStatsLoaded.value = true
  }
}

const nameCompany = computed(() => stats.value.organisation || 'Bedrijfsnaam')
const meetingsToday = computed(() => stats.value.meetings_today)
const activeUsers = computed(() => stats.value.active_users_today)
const meetingsThisMonth = computed(() => stats.value.meetings_this_month)
const currentMeetings = computed(() => meetingsThisMonth.value)
const targetMeetings = computed(() => stats.value.monthly_goal)

const isLoading = ref(true)
const assetsProgress = ref(0)
const isWindowLoaded = ref(document.readyState === 'complete')
const isStatsLoaded = ref(false)
const shouldAnimateStatistics = ref(false)
const shouldAnimateGoalProgress = ref(false)
const rotationTick = ref(0)
let isUnmounted = false
let windowLoadListener: (() => void) | null = null
let statsRefreshInterval: ReturnType<typeof setInterval> | null = null
let rotationInterval: ReturnType<typeof setInterval> | null = null

const loaderProgress = computed(() => {
  if (isWindowLoaded.value && assetsProgress.value >= 1 && isStatsLoaded.value) {
    return 1
  }

  const assetsWeightedProgress = assetsProgress.value * 0.8
  const windowWeightedProgress = isWindowLoaded.value ? 0.1 : 0
  const statsWeightedProgress = isStatsLoaded.value ? 0.1 : 0

  return Math.min(assetsWeightedProgress + windowWeightedProgress + statsWeightedProgress, 0.99)
})

const waitForWindowLoad = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') {
      isWindowLoaded.value = true
      resolve()
      return
    }

    windowLoadListener = () => {
      isWindowLoaded.value = true
      resolve()
    }

    window.addEventListener('load', windowLoadListener, { once: true })
  })

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image()

    image.onload = () => {
      resolve()
    }

    image.onerror = () => {
      resolve()
    }

    image.src = src
  })

const preloadCriticalAssets = async () => {
  const officeImages = officeDatabase
    .map((office) => office.image)
    .filter((image): image is string => Boolean(image))
    .map((image) => `/office-images/${image}`)

  const preloadList = Array.from(new Set([companyLogo, '/Claritalk_c.svg', ...officeImages]))

  if (preloadList.length === 0) {
    assetsProgress.value = 1
    return
  }

  let loadedCount = 0
  assetsProgress.value = 0

  await Promise.all(
    preloadList.map(async (assetPath) => {
      await preloadImage(assetPath)
      loadedCount += 1
      assetsProgress.value = loadedCount / preloadList.length
    }),
  )
}

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })

const revealDashboard = async () => {
  await Promise.all([waitForWindowLoad(), preloadCriticalAssets(), fetchStats()])

  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (fonts) {
    await fonts.ready
  }

  await nextTick()
  await waitForPaint()

  if (isUnmounted) {
    return
  }

  assetsProgress.value = 1
  isLoading.value = false
  shouldAnimateStatistics.value = true
}

onMounted(() => {
  void revealDashboard()

  // Refresh stats every 60 seconds
  statsRefreshInterval = setInterval(() => {
    void fetchStats()
  }, 60000)

  // Shared ticker to keep rotating UI sections in sync.
  rotationInterval = setInterval(() => {
    rotationTick.value += 1
  }, 4000)
})

onBeforeUnmount(() => {
  isUnmounted = true

  if (windowLoadListener) {
    window.removeEventListener('load', windowLoadListener)
    windowLoadListener = null
  }

  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval)
    statsRefreshInterval = null
  }

  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
})

const handleStatsAnimationComplete = () => {
  shouldAnimateGoalProgress.value = true
}
</script>

<template>
  <AppBackground />
  <div class="container mx-auto p-4" :class="{ 'app-content--loading': isLoading }">
    <DashboardHeader :name-company="nameCompany" />
    <StatisticsSection
      :meetings-today="meetingsToday"
      :active-users="activeUsers"
      :meetings-this-month="meetingsThisMonth"
      :start-animation="shouldAnimateStatistics"
      @animation-complete="handleStatsAnimationComplete"
    />
    <GoalProgress
      :current-meetings="currentMeetings"
      :target-meetings="targetMeetings"
      :start-animation="shouldAnimateGoalProgress"
    />
    <MiddleSection :rotation-tick="rotationTick" />
    <FeedSection :rotation-tick="rotationTick" />
  </div>
  <PageLoader v-if="isLoading" :progress="loaderProgress" />
</template>

<style scoped>
.app-content--loading {
  visibility: hidden;
  pointer-events: none;
}
</style>
