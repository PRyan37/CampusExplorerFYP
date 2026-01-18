import { defineStore } from 'pinia'
import { db} from '../firebase/Firebase'
import { useAuthStore } from './auth'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'       



export const useFriendsStore = defineStore('friends', {
    state: () => ({
        friendsList: [],
        loading: false,
        error: null
    }),
    actions: {
        async fetchFriends() {
            const auth = useAuthStore()
             if (!auth.user) return

            this.loading = true
            this.error = null
            this.friendsList = []
            try {
                const friendsRef = collection(db, 'friends')
                const q = query(friendsRef, where('userId', '==', auth.user.uid))
                const snapshot = await getDocs(q)
                this.friendsList = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }))
            } catch (e) {
                this.error = e.message
            } finally {
                this.loading = false
                console.log('Friends list fetched:', this.friendsList)
            }
        },
         async addFriend(friendId,friendEmail) {
            console.log('[friends.js] Adding friend with email:', friendEmail)
        const auth = useAuthStore()
        if (!auth.user) {
            console.warn('[friends.js] No authenticated user in addFriend')
            return
        } 

        try {
            console.log('[friends.js] Current user ID:', auth.user.uid)
            console.log('[friends.js] Friend ID to add:', friendId)
            const friendsRef = collection(db, 'friends')
            await addDoc(friendsRef, {
                userId: auth.user.uid,
                userEmail: auth.user.email,
                friendId,
                friendEmail,
                createdAt: serverTimestamp()
            })
              await addDoc(friendsRef, {
                userId: friendId,
                userEmail: friendEmail,
                friendId: auth.user.uid,
                friendEmail: auth.user.email,
                createdAt: serverTimestamp()
            })
        } catch (e) {
            this.error = e.message
        }
    }
    }
})
   