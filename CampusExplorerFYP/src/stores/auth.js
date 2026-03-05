import { defineStore } from "pinia";
import { auth } from "../firebase/Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useFriendRequestsStore } from "./friendRequests";
import { useNotificationsStore } from "./notifications";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase/Firebase";

const functions = getFunctions(app);
const createUserProfileCall = httpsCallable(functions, "createUserProfile");

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

        const friendRequestsStore = useFriendRequestsStore();
        const notificationsStore = useNotificationsStore();

        if (user) {
          friendRequestsStore.subscribeIncomingRequests();
          notificationsStore.start();
        } else {
          friendRequestsStore.unsubscribeIncomingRequests();
          notificationsStore.stop();
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
        await createUserProfileCall({});
        console.log("Created user profile for:", email);
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
      const notificationsStore = useNotificationsStore();
      console.log("Logging out user:", this.user?.email);
      await signOut(auth);
      this.user = null;
      this.isAuthenticated = false;
      notificationsStore.stop();
    },
  },
});
