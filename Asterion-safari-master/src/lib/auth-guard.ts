import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export function requireAuth(): Promise<User> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        window.location.href = "/login";
      }
    });
  });
}
