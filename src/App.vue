<script setup lang="ts">
import AppBackground from '@/components/AppBackground.vue'
</script>

<template>
  <AppBackground />
  <div class="container mx-auto p-4">
    <div class="c-title">
      <h1 class="c-title__title">Titeca</h1>
      <div class="c-title__right">
        <div class="c-title__live">
          <div class="c-title__live__circle"></div>
          <p class="c-title__live__text">Live</p>
        </div>
        <div class="c-title__powered card-bg--light">
          <p class="c-title__powered__text">Powered by</p>
          <img src="./assets/Icon.png" alt="Company Logo" class="c-title__logo" />
        </div>
      </div>
    </div>
    <div class="c-statistics">
      <div class="c-statistics__card card-bg">
        <h2 class="c-statistics__title">Meetings vandaag</h2>
        <div class="c-statistics__text">
          <p class="c-statistics__nr">28</p>
          <p class="c-statistics__subtext">Over alle kantoren</p>
        </div>
      </div>
      <div class="c-statistics__card card-bg">
        <h2 class="c-statistics__title">Actieve gebruikers</h2>
        <div class="c-statistics__text">
          <p class="c-statistics__nr">29</p>
          <p class="c-statistics__subtext">Actieve gebruikers vandaag</p>
        </div>
      </div>
      <div class="c-statistics__card card-bg">
        <h2 class="c-statistics__title">Meetings deze maand</h2>
        <div class="c-statistics__text"></div>
        <div class="c-statistics__text">
          <p class="c-statistics__nr">293</p>
          <p class="c-statistics__subtext">Bedrijfsbreed</p>
        </div>
      </div>
    </div>
    <div class="c-middlesection">
      <div class="c-map-container">
        <div class="c-map card-bg">
          <h2 class="c-map__title">Kantoren wereldwijd</h2>
          <img src="./assets/placeholder.jpg" alt="World Map" class="c-map__image" />
        </div>
      </div>
      <div class="c-stats">
        <div class="c-stats__office card-bg--light">
          <h2 class="c-stats__office__title">Kantoor in de kijker</h2>
          <p class="c-stats__office__name">Kantoor Ieper</p>
          <p class="c-stats__office__subtext">Over de hele wereld</p>
          <p class="c-stats__office__trend">+2 deze maand</p>
        </div>
        <div class="c-stats__users card-bg">
          <h2 class="c-stats__title">Top gebruikers</h2>
          <ul class="c-stats__users__list">
            <li class="c-stats__users__item">
              <div class="c-stats__users__name">
                <p class="c-stats__users__nr">1</p>
                <p>Jan Janssens</p>
              </div>

              <span class="material-symbols-outlined c-stats__users__icon" aria-hidden="true"
                >crown</span
              >
            </li>
            <li class="c-stats__users__item">
              <div class="c-stats__users__name">
                <p class="c-stats__users__nr">2</p>
                <p>Marie De Coster</p>
              </div>
              <span class="material-symbols-outlined c-stats__users__icon" aria-hidden="true"
                >electric_bolt</span
              >
            </li>
            <li class="c-stats__users__item">
              <div class="c-stats__users__name">
                <p class="c-stats__users__nr">3</p>
                <p>Tom De Bruyn</p>
              </div>
              <span class="material-symbols-outlined c-stats__users__icon" aria-hidden="true"
                >kid_star</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="c-feed">
      <div class="c-feed__item card-bg">
        <h2 class="c-feed__title">
          <div class="c-title__live__circle"></div>
          Live activiteiten
        </h2>
        <ul class="c-feed__list">
          <li class="c-feed__list__item">
            Jan Janssens had een meeting in Kantoor Ieper
            <div class="c-feed__list__time">12:30</div>
          </li>
          <li class="c-feed__list__item">
            Marie De Coster had een meeting in Kantoor Brussel
            <div class="c-feed__list__time">10:45</div>
          </li>
          <li class="c-feed__list__item">
            Tom De Bruyn had een meeting in Kantoor Antwerpen
            <div class="c-feed__list__time">08:30</div>
          </li>
        </ul>
      </div>
      <div class="c-feed__tips card-bg">
        <h2>Leuke weetjes</h2>
        <div class="c-feed__tips__tip">
          <span class="material-symbols-outlined c-feed__icon" aria-hidden="true">
            emoji_objects
          </span>
          <p>Jullie hadden deze week 180 meetingen. Dat zijn er 36 per dag!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
