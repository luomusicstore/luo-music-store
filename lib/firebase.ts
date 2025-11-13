import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyANzlt8ggYe30qH5HWTk74AZStNIAkbDh4",
  authDomain: "luo-music-store.firebaseapp.com",
  databaseURL: "https://luo-music-store-default-rtdb.firebaseio.com",
  projectId: "luo-music-store",
  storageBucket: "luo-music-store.firebasestorage.app",
  messagingSenderId: "535502142157",
  appId: "1:535502142157:web:0e213c105b3f472edf4784",
  measurementId: "G-XYZDJCJJMZ",
}

let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (error) {
  app = initializeApp(firebaseConfig)
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)

export { app }
