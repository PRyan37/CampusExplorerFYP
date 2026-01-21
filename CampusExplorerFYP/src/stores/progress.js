import { defineStore } from 'pinia'
import { db} from '../firebase/Firebase'         
import { doc, getDoc } from 'firebase/firestore' 

export const useProgressStore = defineStore('progress', {
  state: () => ({
    score: 0,
    error: null, 
  }),

  actions: {


 async calculateScoreForUser(userId) {
      this.loading = true
      this.error = null

      try {
        const userRef = doc(db, 'users', userId)
        const snap = await getDoc(userRef)
        if (!snap.exists()) return

        const data = snap.data()
        const discoveries = [
          data.computerDiscovered,
          data.foodDiscovered,
          data.engineeringDiscovered,
          data.beerDiscovered
        ]

        const discoveredCount = discoveries.filter(Boolean).length
        const pointsPerLocation = 10
        const score = discoveredCount * pointsPerLocation


        return score
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    }

  }
})