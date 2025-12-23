import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBfCLdqhyNws2-3ZidKMGKXNweG0-6kks0",
  authDomain: "luo-music-store-8a23d.firebaseapp.com",
  projectId: "luo-music-store-8a23d",
  storageBucket: "luo-music-store-8a23d.firebasestorage.app",
  messagingSenderId: "351930823514",
  appId: "1:351930823514:web:ef0cc1f70cc0aede327963",
  measurementId: "G-2CEG0Z0QVB",
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

export { firebaseConfig }

export const GOOGLE_CLIENT_ID = `${firebaseConfig.appId.split(":")[1].split(":")[0]}-${firebaseConfig.appId.split(":")[2].replace("web:", "")}.apps.googleusercontent.com`

let analytics
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { app, analytics }
