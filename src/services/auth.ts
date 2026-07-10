import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
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
    const uid = userCredential.user.uid;

    this.setUser(uid);

    return uid;
  }

  initialize(onError: (error: unknown) => void): () => void {
    return firebaseOnAuthStateChanged(getAuth(), (user) => {
      if (user) {
        this.setUser(user.uid);
        return;
      }

      this.setUser(null);
      this.signInAnonymously().catch(onError);
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
