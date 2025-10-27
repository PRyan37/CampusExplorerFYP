<template>
<h1>Leaflet Map</h1>
      <div id="map" ref="mapEl"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'
import beerImg from './assets/BeerIcon.png' 

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

var beerIcon = new defaultIcon({iconUrl: beerImg});


onMounted(async () => {
    await nextTick() // ensure DOM rendered
    if (!mapEl.value) return
    map = L.map(mapEl.value).setView([51.505, -0.09], 13)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)
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


</script>

<style scoped>
#map { height: 900px; }
</style>
