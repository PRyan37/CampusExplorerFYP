<template>
  <h1>Leaflet Map</h1>
  <button @click="undiscoverAll">Reset Discoveries</button>
  <!-- <button @click="discoverComputer">Discover Computer Science</button>
  <button @click="discoverFood">Discover Cafeteria</button>
  <button @click="discoverEngineering">Discover Engineering</button>
  <button @click="discoverBeer">Discover Beer Spot</button> -->
  <button @click="getCurrentLocation">Center On My Location</button>
  <div id="map" ref="mapEl"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'
import beerImg from './assets/BeerIcon.png'
import computerImg from './assets/ComputerIcon.png'
import foodImg from './assets/FoodIcon.png'
import engineeringImg from './assets/EngineeringIcon.png'
import questionMarkImg from './assets/QuestionMarkIcon.png'
import { useAuthStore } from './stores/auth'
import { db } from './firebase/Firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const auth = useAuthStore()


const mapEl = ref(null)
let map = null
let clickHandler = null



const defaultIcon = L.Icon.extend({
  options: {
    iconSize: [32, 32],
    shadowSize: [50, 64],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }
});

const unknownIcon = new defaultIcon({ iconUrl: questionMarkImg })

const discoveredIcons = {
  beer: new defaultIcon({ iconUrl: beerImg }),
  computer: new defaultIcon({ iconUrl: computerImg }),
  food: new defaultIcon({ iconUrl: foodImg }),
  engineering: new defaultIcon({ iconUrl: engineeringImg }),

};


let computerMarker, foodMarker, engineeringMarker, beerMarker
let computerDiscovered = false
let foodDiscovered = false
let engineeringDiscovered = false
let beerDiscovered = false
let watchId = null
let marker, circle, zoomed;

async function setDiscoveredOnUser(location) {
  if (!auth.user) return

  try {
    const userRef = doc(db, 'users', auth.user.uid)
    await updateDoc(userRef, { [location]: true })
  } catch (e) {
    console.error('[LeafletMap] Failed to update discovery flag', location, e)
  }
}

async function discoverComputer() {

  computerMarker.setIcon(discoveredIcons.computer)
  computerDiscovered = true
  await setDiscoveredOnUser('engineeringDiscovered')
}

async function discoverFood() {

  foodMarker.setIcon(discoveredIcons.food)
  foodDiscovered = true
  await setDiscoveredOnUser('foodDiscovered')
}

async function discoverEngineering() {

  engineeringMarker.setIcon(discoveredIcons.engineering)
  engineeringDiscovered = true
  await setDiscoveredOnUser('engineeringDiscovered')
}

async function discoverBeer() {

  beerMarker.setIcon(discoveredIcons.beer)
  beerDiscovered = true
  await setDiscoveredOnUser('beerDiscovered')
}
function getCurrentLocation() {
  console.log('[LeafletMap] getCurrentLocation clicked')

  if (!map) {
    console.warn('[LeafletMap] Map is not ready yet')
    return
  }


  if (!('geolocation' in navigator)) {
    alert('Geolocation is not supported by this browser.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('[LeafletMap] getCurrentPosition success', position)
      success(position)
    },
    (err) => {
      console.error('[LeafletMap] getCurrentPosition error', err)
      error(err)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  )
}

onMounted(async () => {
  await setUpMap()
})


function initMapInstance() {
  map = L.map(mapEl.value).setView([53.2803, -9.06], 15)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  computerMarker = L
    .marker([53.28027348648772, -9.058721065521242], { icon: unknownIcon })
    .addTo(map)
    .bindPopup('Computer Science Building')

  foodMarker = L
    .marker([53.27984730218445, -9.060936570167543], { icon: unknownIcon })
    .addTo(map)
    .bindPopup('Campus Cafeteria')

  engineeringMarker = L
    .marker([53.283952206483185, -9.063854813575746], { icon: unknownIcon })
    .addTo(map)
    .bindPopup('Engineering Building')

  beerMarker = L
    .marker([53.277980540805586, -9.05839115381241], { icon: unknownIcon })
    .addTo(map)
    .bindPopup('Come here for a beer!')
}
async function setUpMap() {
  await nextTick()
  if (!mapEl.value) return
  initMapInstance()
  if (auth.user) {
    try {
      const userRef = doc(db, 'users', auth.user.uid)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data = snap.data()
        computerDiscovered = !!data.computerDiscovered
        foodDiscovered = !!data.foodDiscovered
        engineeringDiscovered = !!data.engineeringDiscovered
        beerDiscovered = !!data.beerDiscovered
        if (computerDiscovered) computerMarker.setIcon(discoveredIcons.computer)
        if (foodDiscovered) foodMarker.setIcon(discoveredIcons.food)
        if (engineeringDiscovered) engineeringMarker.setIcon(discoveredIcons.engineering)
        if (beerDiscovered) beerMarker.setIcon(discoveredIcons.beer)
      }
    } catch (e) {
      console.error('[LeafletMap] Failed to load discovery state', e)
    }
  }

  clickHandler = (e) => {
    // e.latlng is a LatLng object {lat, lng}
    console.log('Map click:', e.latlng)
    success({ coords: { latitude: e.latlng.lat, longitude: e.latlng.lng, accuracy: 20 } })
  }
  map.on('click', clickHandler)

  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(success, error)
  } else {
    alert('Geolocation is not supported by this browser.')
  }
}



async function undiscoverAll() {
  computerDiscovered = false
  foodDiscovered = false
  engineeringDiscovered = false
  beerDiscovered = false

  computerMarker.setIcon(unknownIcon)
  foodMarker.setIcon(unknownIcon)
  engineeringMarker.setIcon(unknownIcon)
  beerMarker.setIcon(unknownIcon)

  if (auth.user) {
    try {
      const userRef = doc(db, 'users', auth.user.uid)
      await updateDoc(userRef, {
        computerDiscovered: false,
        foodDiscovered: false,
        engineeringDiscovered: false,
        beerDiscovered: false
      })
    } catch (e) {
      console.error('[LeafletMap] Failed to reset discoveries', e)
    }
  }
}

function updateUserLocationMarker(latitude, longitude, accuracy = 20) {
  if (marker) {
    map.removeLayer(marker)
  }
  if (circle) {
    map.removeLayer(circle)
  }

  marker = L.marker([latitude, longitude]).addTo(map)
  circle = L.circle([latitude, longitude], { radius: accuracy }).addTo(map)

  if (!zoomed) {
    zoomed = map.fitBounds(circle.getBounds())
  }
  map.setView([latitude, longitude])
}



async function success(position) {
  console.log('[LeafletMap] success', position)
  if (!map) return;
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = 20
  updateUserLocationMarker(latitude, longitude, accuracy)
  // 🔹 check discovery radius (~50m) around each POI
  const userLatLng = L.latLng(latitude, longitude)
  const discoverRadius = 50 // meters

  if (!computerDiscovered && userLatLng.distanceTo(computerMarker.getLatLng()) <= discoverRadius) {
    computerDiscovered = true
    computerMarker.setIcon(discoveredIcons.computer)
    await setDiscoveredOnUser('computerDiscovered')
  }

  if (!foodDiscovered && userLatLng.distanceTo(foodMarker.getLatLng()) <= discoverRadius) {
    foodDiscovered = true
    foodMarker.setIcon(discoveredIcons.food)
    await setDiscoveredOnUser('foodDiscovered')
  }

  if (!engineeringDiscovered && userLatLng.distanceTo(engineeringMarker.getLatLng()) <= discoverRadius) {
    engineeringDiscovered = true
    engineeringMarker.setIcon(discoveredIcons.engineering)
    await setDiscoveredOnUser('engineeringDiscovered')
  }

  if (!beerDiscovered && userLatLng.distanceTo(beerMarker.getLatLng()) <= discoverRadius) {
    beerDiscovered = true
    beerMarker.setIcon(discoveredIcons.beer)
    await setDiscoveredOnUser('beerDiscovered')
  }


}
function error(err) {
  if (err.code === 1) {
    alert("Please allow location access to use this feature.");
  } else {
    alert("Error retrieving location");
  }

}
onBeforeUnmount(() => {
  if (watchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
  if (map) {
    if (clickHandler) {
      map.off('click', clickHandler)
    }
    map.remove()
    map = null
  }
})


</script>

<style scoped>
#map {
  height: 900px;
}
</style>
