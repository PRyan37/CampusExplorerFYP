import { defineStore } from "pinia";
import { db } from "../firebase/Firebase";
import { useAuthStore } from "./auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export const useFriendsStore = defineStore("friends", {
  state: () => ({
    friendsList: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchFriends() {
      const auth = useAuthStore();
      if (!auth.user) return;

      this.loading = true;
      this.error = null;
      this.friendsList = [];
      try {
        const friendsRef = collection(db, "friends");
        const q = query(friendsRef, where("userId", "==", auth.user.uid));
        const snapshot = await getDocs(q);
        this.friendsList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        console.log("Friends list fetched:", this.friendsList);
      }
    },
 
  },
});
