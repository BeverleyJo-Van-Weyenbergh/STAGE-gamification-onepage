<script setup lang="ts">
import companyLogo from '@/assets/Icon.png'

defineProps<{
  nameCompany?: string
}>()
</script>

<template>
  <div class="c-title">
    <h1 class="c-title__title">{{ nameCompany ? nameCompany.charAt(0).toUpperCase() + nameCompany.slice(1) : 'Bedrijfsnaam niet meegegeven' }}</h1>
    <div class="c-title__right">
      <div class="c-title__live">
        <div class="c-title__live__circle"></div>
        <p class="c-title__live__text">Live</p>
      </div>
      <div class="c-title__powered card-bg--light">
        <p class="c-title__powered__text">Powered by</p>
        <img :src="companyLogo" alt="Company Logo" class="c-title__logo" />
      </div>
    </div>
  </div>
</template>
