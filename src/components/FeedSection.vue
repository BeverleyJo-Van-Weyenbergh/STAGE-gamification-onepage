<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { arrTips } from '@/data/weetjes'

const props = defineProps<{
  rotationTick: number
}>()

interface RecentMeeting {
  user_name: string
  office: string
  started_at: string
}

interface RecentMeetingApi {
  user_name?: string
  office?: string
  updated_at?: string
  updatedAt?: string
  created_at?: string
}

interface RecentMeetingsResponse {
  recent_meetings?: RecentMeetingApi[]
}

const recentMeetings = ref<RecentMeeting[]>([])
let recentMeetingsInterval: ReturnType<typeof setInterval> | null = null

const getStartedAt = (meeting: RecentMeetingApi) =>
  meeting.created_at ?? meeting.updated_at ?? meeting.updatedAt ?? ''

const fetchRecentMeetings = async () => {
  try {
    const response = await fetch(`https://stats.claritalk.com/stats/recent-meetings`)
    if (!response.ok) throw new Error('Failed to fetch recent meetings')
    const data: RecentMeetingsResponse = await response.json()
    const meetings = Array.isArray(data.recent_meetings) ? [...data.recent_meetings] : []
    const meetingsByStartedAt = meetings.sort((meetingA, meetingB) =>
      getStartedAt(meetingB).localeCompare(getStartedAt(meetingA)),
    )

    recentMeetings.value = meetingsByStartedAt.slice(0, 3).map((meeting) => ({
      user_name: meeting.user_name ?? 'Onbekende gebruiker',
      office: meeting.office ?? 'een Titeca kantoor',
      started_at: getStartedAt(meeting),
    }))
  } catch (error) {
    console.error('Failed to fetch recent meetings:', error)
  }
}

const formatTime = (dateTime: string) => (dateTime ? dateTime.slice(11, 16) : '--:--')

onMounted(() => {
  fetchRecentMeetings()

  recentMeetingsInterval = setInterval(() => {
    void fetchRecentMeetings()
  }, 15000)
})

onBeforeUnmount(() => {
  if (recentMeetingsInterval) {
    clearInterval(recentMeetingsInterval)
    recentMeetingsInterval = null
  }
})

const currentTipIndex = ref(0)

const currentTip = computed(
  () => arrTips[currentTipIndex.value]?.tip ?? 'Nog geen weetjes beschikbaar.',
)

const showNextTip = () => {
  if (arrTips.length <= 1) {
    return
  }

  currentTipIndex.value = (currentTipIndex.value + 1) % arrTips.length
}

watch(
  () => props.rotationTick,
  () => {
    showNextTip()
  },
)
</script>

<template>
  <div class="c-feed">
    <div class="c-feed__item card-bg">
      <h2 class="c-feed__title">
        <div class="c-title__live__circle"></div>
        Live activiteiten
      </h2>
      <ul class="c-feed__list">
        <li
          v-for="meeting in recentMeetings"
          :key="meeting.started_at + meeting.user_name"
          class="c-feed__list__item"
        >
          <p class="c-feed__list__sentence">{{ meeting.user_name }} had een meeting in</p>
          <div class="c-feed__list__meta">
            <span class="c-feed__list__office">{{ meeting.office }}</span>
            <span class="c-feed__list__time">{{ formatTime(meeting.started_at) }}</span>
          </div>
        </li>
      </ul>
    </div>
    <div class="c-feed__tips card-bg">
      <h2>Leuke weetjes</h2>
      <div class="c-feed__tips__tip">
        <span class="material-symbols-outlined c-feed__icon" aria-hidden="true">emoji_objects</span>
        <Transition name="c-tip-switch" mode="out-in">
          <p :key="currentTipIndex" class="c-feed__tip-text">{{ currentTip }}</p>
        </Transition>
      </div>
    </div>
  </div>
</template>
