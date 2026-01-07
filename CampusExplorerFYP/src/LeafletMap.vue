<template>
<h1>Leaflet Map</h1>
      <div id="map" ref="mapEl"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'
import beerImg from './assets/BeerIcon.png' 
import computerImg from './assets/ComputerIcon.png'
import foodImg from './assets/FoodIcon.png'
import engineeringImg from './assets/EngineeringIcon.png'
import questionMarkImg from './assets/QuestionMarkIcon.png'

const props = defineProps({
  sult: { type: Boolean}
})

const mapEl = ref(null)
let map = null
let clickHandler = null

var defaultIcon = L.Icon.extend({
    options: {
        iconSize:     [32, 32],
        shadowSize:   [50, 64],
        iconAnchor:   [16, 32],
        popupAnchor:  [0, -32]
    }
});

var beerIcon = new defaultIcon({iconUrl: questionMarkImg});
var computerIcon = new defaultIcon({iconUrl: questionMarkImg});
var foodIcon = new defaultIcon({iconUrl: questionMarkImg});
var engineeringIcon = new defaultIcon({iconUrl: questionMarkImg});

if(props.sult==true){
    beerIcon = new defaultIcon({iconUrl: beerImg});
}
function setIcon(url){
  return new defaultIcon({ iconUrl: url })
}

onMounted(async () => {
    await nextTick() // ensure DOM rendered
    if (!mapEl.value) return
    map = L.map(mapEl.value).setView([51.505, -0.09], 13)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)
    L.marker([53.28027348648772, -9.058721065521242], {icon: computerIcon}).addTo(map).bindPopup("Computer Science Building");
    L.marker([53.27984730218445, -9.060936570167543], {icon: foodIcon}).addTo(map).bindPopup("Campus Cafeteria");
    L.marker([53.283952206483185, -9.063854813575746], {icon: engineeringIcon}).addTo(map).bindPopup("Engineering Building");
    L.marker([53.277980540805586, -9.05839115381241], {icon: beerIcon}).addTo(map).bindPopup("Come here for a beer!");
    clickHandler = (e) => {
      // e.latlng is a LatLng object {lat, lng}
      console.log('Map click:', e.latlng)
    }
    map.on('click', clickHandler)


})
let marker, circle, zoomed;
navigator.geolocation.watchPosition(success, error);


function success(position) {
    if (!map) return;
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy  = position.coords.accuracy;

    if (marker) {
        map.removeLayer(marker);
    }
    if (circle) {
        map.removeLayer(circle);
    } 
    marker = L.marker([latitude, longitude]).addTo(map)
    circle = L.circle([latitude, longitude], { radius: accuracy }).addTo(map);

    if(!zoomed){
        zoomed = map.fitBounds( circle.getBounds());
    }
    map.setView([latitude, longitude]);
   
}
function error(err){
    if (err.code === 1){
         alert("Please allow location access to use this feature.");
    } else {
        alert("Error retrieving location");
    }

}
onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
watch(
  () => props.sult,
  () => {
    if (computerMarker) computerMarker.setIcon(computerIcon.value)
    if (foodMarker) foodMarker.setIcon(foodIcon.value)
    if (engineeringMarker) engineeringMarker.setIcon(engineeringIcon.value)
    if (beerMarker) beerMarker.setIcon(beerIcon.value)
  }
)

</script>

<style scoped>
#map { height: 900px; }
</style>
