import { defineStore } from "pinia";
import { auth, db } from "../firebase/Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFriendRequestsStore } from "./friendRequests";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    ready: false,
  }),
  getters: {
    displayName(state) {
      return state.user?.email || "";
    },
  },
  actions: {
    init() {
      console.log("[auth.init] called");
      onAuthStateChanged(auth, (user) => {
        console.log("[auth.init]Auth state changed. User:", this.isAuthenticated);
        this.user = user;
        this.isAuthenticated = !!user;
        this.ready = true;
        // ✅ subscribe/unsubscribe here (best place)
        const friendRequestsStore = useFriendRequestsStore();
        if (user) {
          friendRequestsStore.subscribeIncomingRequests();
        } else {
          friendRequestsStore.unsubscribeIncomingRequests();
        }
      });
    },

    async register(email, password) {
      console.log("Registering user with email:", email);
      this.loading = true;
      this.error = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        this.user = cred.user;
        this.isAuthenticated = true;

        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          createdAt: serverTimestamp(),
        });

        return cred.user;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      console.log("Logging in user with email:", email);

      this.loading = true;
      this.error = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.user = cred.user;
        this.isAuthenticated = true;
        console.log("Auth state. Auth: ", this.isAuthenticated);

        return cred.user;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      console.log("Logging out user:", this.user?.email);
      await signOut(auth);
      this.user = null;
      this.isAuthenticated = false;
    },
  },
});
