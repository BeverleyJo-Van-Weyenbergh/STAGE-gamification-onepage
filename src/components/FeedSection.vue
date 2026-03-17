<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { arrTips } from '@/data/weetjes'

const props = defineProps<{
  rotationTick: number
}>()

interface RecentMeeting {
  user_name: string
  office: string
  time: string
}

const recentMeetings = ref<RecentMeeting[]>([])

const fetchRecentMeetings = async () => {
  try {
    const response = await fetch(
      `https://stats.claritalk.com/stats/recent-meetings?t=${Date.now()}`,
      { cache: 'no-store' },
    )
    if (!response.ok) throw new Error('Failed to fetch recent meetings')
    const data = await response.json()
    recentMeetings.value = (data.recent_meetings ?? []).slice(0, 3)
  } catch (error) {
    console.error('Failed to fetch recent meetings:', error)
  }
}

const formatTime = (isoString: string) => isoString.slice(11, 16)

onMounted(() => {
  fetchRecentMeetings()
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
          :key="meeting.time + meeting.user_name"
          class="c-feed__list__item"
        >
          {{ meeting.user_name }} heeft een meeting in
          <span class="c-feed__list__office">{{ meeting.office }}</span> gestart
          <div class="c-feed__list__time">{{ formatTime(meeting.time) }}</div>
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
