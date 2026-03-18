<script setup lang="ts">
import mapboxgl, { type Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Office {
  name: string
  address: string
  lat: number
  lon: number
  photo_url: string | null
  meetings_this_month: number
  active_users_this_month: number
}

const offices = ref<Office[]>([])
const mapContainer = ref<HTMLElement | null>(null)
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ''
const hasMapboxToken = mapboxToken.length > 0

let map: Map | null = null
let isMapLoaded = false
const markers: mapboxgl.Marker[] = []

const clearMarkers = () => {
  markers.forEach((marker) => marker.remove())
  markers.length = 0
}

const hasValidCoordinates = (office: Office) =>
  Number.isFinite(office.lat) && Number.isFinite(office.lon)

const updateMapViewport = (visibleOffices: Office[]) => {
  if (!map || visibleOffices.length === 0) {
    return
  }

  if (visibleOffices.length === 1) {
    const [office] = visibleOffices

    if (!office) {
      return
    }

    map.easeTo({
      center: [office.lon, office.lat],
      zoom: 8.5,
      duration: 0,
    })
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  visibleOffices.forEach((office) => {
    bounds.extend([office.lon, office.lat])
  })

  map.fitBounds(bounds, {
    padding: 56,
    maxZoom: 8.5,
    duration: 0,
  })
}

const renderOfficesOnMap = () => {
  if (!map || !isMapLoaded) {
    return
  }

  const mapInstance = map

  clearMarkers()

  const visibleOffices = offices.value.filter(hasValidCoordinates)

  visibleOffices.forEach((office) => {
    const markerElement = createMarkerElement(office.photo_url || '')
    const popupContent = `
      <div style=" border-radius: 20px; padding: 12px; min-width: 200px;">
        <h3 class="c-map__title">${office.name}</h3>
        <p class="c-map__text">Meetings deze maand: ${office.meetings_this_month}</p>
        <p class="c-map__text">Actieve gebruikers: ${office.active_users_this_month}</p>
      </div>
    `
    const marker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat([office.lon, office.lat])
      .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupContent))
      .addTo(mapInstance)

    markers.push(marker)
  })

  updateMapViewport(visibleOffices)
}

const fetchOffices = async () => {
  try {
    const response = await fetch('https://stats.claritalk.com/offices')
    if (!response.ok) throw new Error('Failed to fetch offices')
    const data = (await response.json()) as { offices?: Office[] }
    offices.value = Array.isArray(data.offices) ? data.offices : []
    renderOfficesOnMap()
  } catch (error) {
    console.error('Failed to fetch offices:', error)
  }
}

const createMarkerElement = (imageSrc: string): HTMLElement => {
  const markerDiv = document.createElement('div')
  markerDiv.className = 'custom-marker'
  markerDiv.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid #fde594;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  `

  const img = document.createElement('img')
  img.src = imageSrc
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `
  markerDiv.appendChild(img)

  // Hover effect
  markerDiv.addEventListener('mouseenter', () => {
    markerDiv.style.width = '50px'
    markerDiv.style.height = '50px'
    markerDiv.style.borderWidth = '2px'
  })

  markerDiv.addEventListener('mouseleave', () => {
    markerDiv.style.width = '40px'
    markerDiv.style.height = '40px'
    markerDiv.style.borderWidth = '2px'
  })

  return markerDiv
}

onMounted(async () => {
  await fetchOffices()

  if (!mapContainer.value || !hasMapboxToken) {
    return
  }

  mapboxgl.accessToken = mapboxToken

  map = new mapboxgl.Map({
    container: mapContainer.value,
    center: [3.726699337509956, 50.97798968375213],
    zoom: 7.5,
    attributionControl: false,
  })

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

  map.on('load', () => {
    isMapLoaded = true
    renderOfficesOnMap()
  })
})

onBeforeUnmount(() => {
  clearMarkers()

  if (map) {
    map.remove()
    map = null
  }

  isMapLoaded = false
})
</script>

<template>
  <div v-if="!hasMapboxToken" class="c-map__fallback" role="status" aria-live="polite">
    Voeg <code>VITE_MAPBOX_ACCESS_TOKEN</code> toe in je <code>.env</code> om de kaart te tonen.
  </div>
  <div
    v-else
    ref="mapContainer"
    class="c-map__map js-mapbox-map"
    aria-label="Interactieve wereldkaart met kantoorlocaties"
  ></div>
</template>
