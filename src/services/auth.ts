import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
} from "@react-native-firebase/auth";
import useUserStore from "../stores/UserStore";
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
    useUserStore.getState().setUser(uid ? { uid } : null);

    if (uid) {
      userService.saveUser(uid).catch((error) => {
        console.error("Failed to save user", error);
      });
    }
  }
}

const auth = new AuthService();

export default auth;
