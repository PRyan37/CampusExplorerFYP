<script setup>
import IntroductionMap from "@/IntroductionMap.vue";
</script>

<template>
    <div class="top-bar">
        <div class="left-buttons">
            <button @click="$router.push('/login')">Get Started</button>
        </div>

        <h1 class="title">Introduction</h1>
    </div>
    <div class="summary">
        The University of Galway Campus and Service Explorer will be a web application aimed at first
        year students at University of Galway. It will be accessible on all students’ phones. The Web
        App will encourage students to explore all areas of the campus and participate in the
        opportunities it has to offer. This Web App will incorporate a gamified element, allowing
        students to collect points for each new part of the campus they explore. Students will also be
        able to add their peers as friends on the app and compare scores on a leaderboard. The Web App
        will require access to the camera on the student’s phone. Students will score points on the app
        by scanning different QR codes around the campus. A map API will also be utilised so users can
        get a visualisation of where the locations of interests are in relation to their current
        location. Students will also have the option to log on to the web application on their laptop or
        computer.
    </div>
    <!-- <div class="map-wrapper">
        <IntroductionMap />
    </div> -->
</template>

<style scoped>
.summary {
    margin: 20px;
    margin-top: 40px;
    margin-bottom: 40px;
    font-size: 20px;
}

.map-wrapper {
    flex: 1 1 auto;
    min-height: 0;
}

@media (max-width: 576px) {
    .summary {
        margin: 12px;
        margin-top: 16px;
        margin-bottom: 16px;
        font-size: 14px;
        line-height: 1.3;
    }
}

.top-bar {
    position: relative;
    width: 100%;
    height: 60px;
    background-color: #9fb9ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.title {
    margin: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

.left-buttons {
    margin-right: auto;
    display: flex;
    gap: 8px;
}
</style>
