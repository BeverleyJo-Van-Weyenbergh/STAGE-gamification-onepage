<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
}>()

const clampedFill = computed(() => {
  const normalized = Math.min(Math.max(props.progress, 0), 1)
  return `${normalized * 100}%`
})
</script>

<template>
  <div class="loader-overlay">
    <div class="loader">
      <div
        class="logo-fill"
        role="img"
        aria-label="Claritalk logo"
        :style="{ '--fill-level': clampedFill }"
      ></div>
    </div>
    <h2>Aan het laden...</h2>
  </div>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loader {
  width: min(42vw, 220px);
}

.logo-fill {
  --logo-url: url('/Claritalk_c.svg');
  position: relative;
  width: 100%;
  aspect-ratio: 420 / 448;
  background: #fde594;
  -webkit-mask-image: var(--logo-url);
  mask-image: var(--logo-url);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-position: center;
  mask-position: center;
  overflow: hidden;
}

.logo-fill::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--fill-level, 0%);
  background: #682577;
  transition: height 140ms linear;
}

h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
</style>
