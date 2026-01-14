import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('../SignIn.vue') },
  { path: '/', name: 'home', component: () => import('../views/MainPage.vue'), meta: { requiresAuth: true } }
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