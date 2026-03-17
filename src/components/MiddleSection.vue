<script setup lang="ts">
import MapboxWorldMap from '@/components/MapboxWorldMap.vue'
import { computed, onMounted, ref, watch } from 'vue'

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

interface HighlightItem {
  kind: 'user' | 'office'
  name: string
  subtext: string
  trend: string
}

const topUsers = ref<TopUser[]>([])
const highlights = ref<HighlightItem[]>([])
const currentHighlightIndex = ref(0)

const fallbackHighlight: HighlightItem = {
  kind: 'office',
  name: 'Geen data beschikbaar',
  subtext: 'Over de hele wereld',
  trend: '',
}

const currentHighlight = computed(
  () => highlights.value[currentHighlightIndex.value] ?? fallbackHighlight,
)

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
            trend: `+${data.trending_office.growth} deze week`,
          }
        : null,
    ].filter((item): item is HighlightItem => item !== null)

    currentHighlightIndex.value = 0
  } catch (err) {
    console.error('Failed to fetch middle section data:', err)
  }
}

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
  void fetchMiddleSectionData()
})
</script>

<template>
  <div class="c-middlesection">
    <div class="c-map-container">
      <div class="c-map card-bg">
        <h2>Kantoren</h2>
        <MapboxWorldMap />
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
              {{ user.rank === 1 ? 'crown' : user.rank === 2 ? 'electric_bolt' : 'kid_star' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.c-stats__office__content {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  container-type: inline-size;
}

.c-stats__office__name {
  white-space: nowrap;
  overflow: hidden;
  font-size: clamp(1rem, 8cqi, 2rem);
}

.c-stats__office__dots {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.c-stats__office__dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: rgba(104, 37, 119, 0.35);
  transition:
    width 260ms ease,
    background-color 260ms ease,
    transform 260ms ease;
}

.c-stats__office__dot.is-active {
  width: 1.2rem;
  background: #682577;
  transform: translateY(-1px);
}

.highlight-rotate-enter-active,
.highlight-rotate-leave-active {
  transition:
    opacity 360ms ease,
    transform 360ms ease,
    filter 360ms ease;
}

.highlight-rotate-enter-from {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(1.5px);
}

.highlight-rotate-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  filter: blur(1.5px);
}
</style>
