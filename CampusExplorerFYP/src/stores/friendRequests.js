import { defineStore } from 'pinia'
import { db} from '../firebase/Firebase'
import { useAuthStore } from './auth'
import { useFriendsStore } from './friends'
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



export const useFriendRequestsStore = defineStore('friendRequests', {
    state: () => ({
incomingRequests: [],
outgoingRequests: [],
loading: false,
error: null
}),
 actions: {
    async fetchIncomingRequests() {
        console.log('[friendRequests.js] Fetching incoming friend requests...')
            const auth = useAuthStore()
             if (!auth.user) return
            this.loading = true
            this.error = null
            try {
                const incomingRequestRef = collection(db, 'friendRequests')
                const q = query(incomingRequestRef,  where('toUserId', '==', auth.user.uid))
                const snapshot = await getDocs(q)
                this.incomingRequests = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }))
            } catch (e) {
                this.error = e.message
            } finally {
                this.loading = false
                console.log('[friendRequests.js] Incoming friend requests fetched:', this.incomingRequests)
            }
  },
  async fetchOutgoingRequests() {
            const auth = useAuthStore()
             if (!auth.user) return
            this.loading = true
            this.error = null

            try {
                const outgoingRequestRef = collection(db, 'friendRequests')
                const q = query(outgoingRequestRef, where('fromUserId', '==', auth.user.uid))
                const snapshot = await getDocs(q)
                this.outgoingRequests = snapshot.docs.map(doc => doc.data())
            } catch (e) {
                this.error = e.message
            } finally {
                this.loading = false
            }
  },
  async sendFriendRequest( toEmail) {
    console.log('[friendRequests.js]Sending friend request to:', toEmail)
        const auth = useAuthStore()
        if (!auth.user) return
        this.loading = true
        this.error = null

        const usersRef = collection(db, 'users')
        const qUser = query(usersRef, where('email', '==', toEmail))
        const snapUser = await getDocs(qUser)

        if (snapUser.empty) {
            throw new Error('No user found with that email')
        }
        const friendDoc = snapUser.docs[0]
        const toUserId = friendDoc.id
        try {
            const outgoingRequestRef = collection(db, 'friendRequests')
            await addDoc(outgoingRequestRef, {
                fromUserId: auth.user.uid,
                fromEmail: auth.user.email,
                status: 'pending',
                toUserId: toUserId,
                toEmail,
                timestamp: serverTimestamp()
            })
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
        }
    },
    async acceptFriendRequest(requestId) {
        console.log('[friendRequests.js] Accepting friend request:', requestId)
        const auth = useAuthStore()
        if (!auth.user) return
        this.loading = true
        this.error = null
        const friendsStore = useFriendsStore()
         const req = this.incomingRequests.find(r => r.id === requestId)
  if (!req) {
    console.warn('[friendRequests.js] Request not found in state:', requestId)
    return
  }
        try {
              await friendsStore.addFriend(req.fromUserId, req.fromEmail)
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
            const requestDocRef = doc(db, 'friendRequests', requestId)
            await deleteDoc(requestDocRef)
        }
    },
    async rejectFriendRequest(requestId) {
        const auth = useAuthStore()
        if (!auth.user) return
        this.loading = true
        this.error = null

        try {
            const requestDocRef = doc(db, 'friendRequests', requestId)
            await deleteDoc(requestDocRef)
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
            this.fetchIncomingRequests()
            this.fetchOutgoingRequests()
        }
    }
  }
})