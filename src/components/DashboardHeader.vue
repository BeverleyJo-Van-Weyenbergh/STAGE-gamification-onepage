<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import companyLogo from '@/assets/Icon.png'

defineProps<{
  nameCompany?: string
}>()

const isSignupModalOpen = ref(false)
const isSignupSubmitted = ref(false)
const email = ref('')
const signupError = ref('')

const getSignupErrorMessage = (responseBody: unknown) => {
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody
  }

  if (responseBody && typeof responseBody === 'object') {
    const responseData = responseBody as Record<string, unknown>
    const possibleMessage = responseData.message ?? responseData.error ?? responseData.detail

    if (typeof possibleMessage === 'string' && possibleMessage.trim()) {
      return possibleMessage
    }
  }

  return 'Inschrijving mislukt. Probeer opnieuw.'
}

const openSignupModal = () => {
  isSignupModalOpen.value = true
  isSignupSubmitted.value = false
  signupError.value = ''
}

const closeSignupModal = () => {
  isSignupModalOpen.value = false
  isSignupSubmitted.value = false
  email.value = ''
  signupError.value = ''
}

const handleSignup = async () => {
  const trimmedEmail = email.value.trim()
  signupError.value = ''

  if (!trimmedEmail) {
    return
  }

  try {
    const response = await fetch('https://stats.claritalk.com/training-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: trimmedEmail }),
    })

    const contentType = response.headers.get('content-type') ?? ''
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    console.log('Training request response:', {
      status: response.status,
      ok: response.ok,
      body: responseBody,
    })

    if (response.ok) {
      isSignupSubmitted.value = true
      return
    }

    signupError.value = getSignupErrorMessage(responseBody)
  } catch (error) {
    console.error('Training request failed:', error)
    signupError.value = 'Kan de inschrijving niet versturen. Probeer opnieuw.'
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeSignupModal()
  }
}

watch(isSignupModalOpen, (isOpen) => {
  if (isOpen) {
    document.body.classList.add('has-signup-modal')
    window.addEventListener('keydown', handleEscape)
    return
  }

  document.body.classList.remove('has-signup-modal')
  window.removeEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.body.classList.remove('has-signup-modal')
  window.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="c-title">
    <h1 class="c-title__title">
      {{
        nameCompany
          ? nameCompany.charAt(0).toUpperCase() + nameCompany.slice(1)
          : 'Bedrijfsnaam niet meegegeven'
      }}
    </h1>
    <div class="c-title__signup card-bg">
      <button class="c-title__signup__link" type="button" @click="openSignupModal">
        Investeer in jezelf, schrijf je hier in voor een training!
      </button>
    </div>
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

    <Teleport to="body">
      <Transition name="c-title-modal">
        <div
          v-if="isSignupModalOpen"
          class="c-title__modal-backdrop"
          role="presentation"
          @click.self="closeSignupModal"
        >
          <div class="c-title__modal card-bg--light" role="dialog" aria-modal="true">
            <button
              class="c-title__modal-close"
              type="button"
              aria-label="Sluit inschrijvingsvenster"
              @click="closeSignupModal"
            >
              ✕
            </button>
            <h2 class="c-title__modal-title">Schrijf je in voor een training</h2>
            <p v-if="!isSignupSubmitted" class="c-title__modal-text">
              Laat je e-mail achter en we nemen contact met je op.
            </p>
            <form
              v-if="!isSignupSubmitted"
              class="c-title__modal-form"
              @submit.prevent="handleSignup"
            >
              <label class="c-title__modal-label" for="signup-email">E-mail</label>
              <input
                id="signup-email"
                v-model="email"
                class="c-title__modal-input"
                type="email"
                name="email"
                autocomplete="email"
                placeholder="jouwnaam@bedrijf.be"
                required
              />
              <p v-if="signupError" class="c-title__modal-error">{{ signupError }}</p>
              <button class="c-title__modal-submit" type="submit">Sign up</button>
            </form>
            <div v-else class="c-title__modal-success">
              <p class="c-title__modal-success-text">
                Inschrijving is verstuurd, we nemen zo snel mogelijk contact met je op.
              </p>
              <button
                class="c-title__modal-submit c-title__modal-submit--close"
                type="button"
                @click="closeSignupModal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
