<script setup>
import nuigPic from "@/assets/NUIG-Pic1.jpg";
import nuigPicTwo from "@/assets/NUIG-Pic2.jpg";
import nuigPicThree from "@/assets/NUIG-Pic3.jpeg";
import { useRouter } from "vue-router";
const router = useRouter();

function goToSignIn() {
    router.push("/login");
}
</script>

<template>
    <div class="page">
        <section class="hero" :style="{ backgroundImage: `url(${nuigPic})` }">
            <div class="hero-overlay">
                <div class="top-bar">
                    <button class="get-started-btn" @click="goToSignIn">Get Started</button>
                </div>

                <div class="hero-content">
                    <p class="eyebrow">Discover the University of Galway</p>
                    <h1 class="title">What is Campus Explorer?</h1>
                    <p class="hero-text">
                        Explore campus, unlock hidden locations, and share discoveries with friends.
                    </p>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="summary-card">
                <p>
                    Welcome to Campus Explorer, your ultimate companion for navigating and discovering the
                    campus. Whether you're a new student trying to find your way around or a returning student
                    looking for hidden gems, Campus Explorer helps you explore more of university life.
                </p>

                <p>
                    Campus Explorer uses your phone’s location to track your movement around campus. Areas and
                    points of interest begin hidden, and as you explore and discover new locations, they are
                    added to your personal map so you can find them again later.
                </p>

                <p>
                    The app is designed to encourage exploration beyond the usual routes. You can discover
                    study spaces, social spots, and useful shortcuts while also comparing progress with
                    friends and seeing what they have uncovered.
                </p>

                <p>
                    Start exploring your campus and unlock more of what University of Galway has to offer.
                </p>
            </div>

            <div class="image-grid">
                <div class="image-card">
                    <img :src="nuigPicTwo" alt="University of Galway campus view" />
                </div>
                <div class="image-card">
                    <img :src="nuigPicThree" alt="University of Galway campus view" />
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.page {
    min-height: 100vh;
    background: #f7f4f6;
    color: #1f1f1f;
}

/* Hero section */
.hero {
    min-height: 52vh;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
}

.hero-overlay {
    min-height: 52vh;
    background: linear-gradient(180deg, rgba(18, 18, 18, 0.55) 0%, rgba(121, 21, 61, 0.55) 100%);
    display: flex;
    flex-direction: column;
    padding: 20px;
}

.top-bar {
    display: flex;
    justify-content: flex-end;
}

.get-started-btn {
    background: #ffffff;
    color: #79153d;
    border: none;
    padding: 10px 16px;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s ease;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.get-started-btn:hover {
    background: #79153d;
    color: #ffffff;
}

.hero-content {
    margin: auto 0;
    max-width: 720px;
    color: white;
    padding: 30px 0 20px;
}

.eyebrow {
    margin: 0 0 10px;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.95;
}

.title {
    margin: 0 0 14px;
    font-size: clamp(2rem, 5vw, 3.6rem);
    line-height: 1.05;
}

.hero-text {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
}

/* Main content */
.content {
    max-width: 1100px;
    margin: -40px auto 0;
    padding: 0 20px 40px;
    position: relative;
    z-index: 2;
}

.summary-card {
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(121, 21, 61, 0.1);
    border-radius: 24px;
    padding: 28px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
}

.summary-card p {
    margin: 0 0 16px;
    font-size: 1.05rem;
    line-height: 1.8;
}

.summary-card p:last-child {
    margin-bottom: 0;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.image-card {
    background: white;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(121, 21, 61, 0.08);
}

.image-card img {
    display: block;
    width: 100%;
    height: 280px;
    object-fit: cover;
}

/* Mobile */
@media (max-width: 768px) {
    .hero {
        min-height: 44vh;
    }

    .hero-overlay {
        min-height: 44vh;
        padding: 16px;
    }

    .content {
        margin-top: -24px;
        padding: 0 14px 24px;
    }

    .summary-card {
        padding: 18px;
        border-radius: 18px;
    }

    .summary-card p {
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .image-grid {
        grid-template-columns: 1fr;
    }

    .image-card img {
        height: 220px;
    }

    .get-started-btn {
        padding: 9px 14px;
        font-size: 0.95rem;
    }
}
</style>
