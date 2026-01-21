import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/introduction', name: 'introduction', component: () => import('../views/IntroductionPage.vue') },
  { path: '/login', name: 'login', component: () => import('../views/SignInPage.vue') },
  { path: '/', name: 'home', component: () => import('../views/MainPage.vue'), meta: { requiresAuth: true } },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('../views/LeaderboardPage.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
   const auth = useAuthStore()
  if (!auth.ready) {
    await new Promise((resolve) => {
      const stop = auth.$subscribe(
        (mutation, state) => {
          if (state.ready) {
            console.log('[router.beforeEach] auth.ready became true')
            stop()
            resolve()
          }
        },
        { detached: true }
      )
    })
  }
 
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/' }
  }
})

export default router