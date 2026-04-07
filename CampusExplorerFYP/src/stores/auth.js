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
import { useCampusLocs } from "./campusLocs";
import { useCampusAreasStore } from "./campusAreas";

// cloud function setup
const functions = getFunctions(app);
const createUserProfileCall = httpsCallable(functions, "createUserProfile");

  // manages user authentication state, including registration, login, logout, and reacting to auth state changes to set up/tear down related data listeners
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // current Firebase user object
    isAuthenticated: false,
    loading: false,
    error: null,
    ready: false, // becomes true after the first onAuthStateChanged callback
  }),

  actions: {
    // Firebse auth state listener that updates the store's user and isAuthenticated state whenever the user's auth state changes (e.g. login, logout, token refresh)
    init() {
      console.log("[auth.init] called");
      onAuthStateChanged(auth, async (user) => {
        console.log("[auth.init]Auth state changed. User:", this.isAuthenticated);

        // update auth store state
        this.user = user;
        this.isAuthenticated = !!user;
        this.ready = true;

        const friendRequestsStore = useFriendRequestsStore();
        const notificationsStore = useNotificationsStore();
        const campusLocsStore = useCampusLocs();
        const campusAreasStore = useCampusAreasStore();

        if (user) {
          //user login
          friendRequestsStore.subscribeIncomingRequests();
          notificationsStore.start();
          await campusLocsStore.startListeningLocations();
          await campusAreasStore.startListeningAreas();
        } else {
            //user logout
          friendRequestsStore.unsubscribeIncomingRequests();
          notificationsStore.stop();
          campusLocsStore.stopListeningLocations();
          campusAreasStore.stopListeningAreas();
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
      const campusLocsStore = useCampusLocs();
      const campusAreasStore = useCampusAreasStore();
      console.log("Logging out user:", this.user?.email);
      await signOut(auth);
      this.user = null;
      this.isAuthenticated = false;
      notificationsStore.stop();
      campusLocsStore.stopListeningLocations();
      campusAreasStore.stopListeningAreas();
    },
  },
});
