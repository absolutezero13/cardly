import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
} from "@react-native-firebase/auth";
import useCardsStore from "../stores/CardsStore";
import useUserStore from "../stores/UserStore";
import { AnalyticsEvent, analyticsService } from "./analytics";
import userService from "./user";

class AuthService {
  async signInAnonymously(): Promise<string> {
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;

    if (currentUser) {
      this.setUser(currentUser.uid);
      return currentUser.uid;
    }

    const userCredential = await firebaseSignInAnonymously(firebaseAuth);
    analyticsService.logEvent(AnalyticsEvent.SignIn);

    return userCredential.user.uid;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getAuth());
    this.setUser(null);
  }

  initialize(onInitialized: () => void): () => void {
    return firebaseOnAuthStateChanged(getAuth(), (user) => {
      this.setUser(user?.uid ?? null);
      onInitialized();
    });
  }

  private setUser(uid: string | null): void {
    const previousUid = useUserStore.getState().user?.uid ?? null;

    if (previousUid !== uid) {
      useCardsStore.getState().reset();
    }

    useUserStore.getState().setUser(uid ? { uid } : null);
    analyticsService.setUserId(uid);

    if (uid) {
      userService.saveUser(uid).catch((error) => {
        console.error("Failed to save user", error);
      });
    }
  }
}

const auth = new AuthService();

export default auth;
