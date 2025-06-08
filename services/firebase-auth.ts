import { auth, db } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import type { User } from "@/types/database"

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    if (!auth || !db) {
      throw new Error("Firebase is not initialized")
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName })

      // Create user document in Firestore
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName,
        isVerified: false,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, "users", user.uid), userData)

      // Send verification email
      await sendEmailVerification(user)

      return userData
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    if (!auth || !db) {
      throw new Error("Firebase is not initialized")
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) {
        throw new Error("User document not found")
      }

      const userData = userDoc.data() as User
      return {
        ...userData,
        isVerified: user.emailVerified,
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  static async signOut(): Promise<void> {
    if (!auth) {
      throw new Error("Firebase auth is not initialized")
    }

    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  static async getUserData(uid: string): Promise<User> {
    if (!db) {
      throw new Error("Firebase db is not initialized")
    }

    try {
      const userDoc = await getDoc(doc(db, "users", uid))
      if (!userDoc.exists()) {
        throw new Error("User document not found")
      }

      return userDoc.data() as User
    } catch (error) {
      console.error("Get user data error:", error)
      throw error
    }
  }

  static async updateWalletAddress(uid: string, walletAddress: string): Promise<void> {
    if (!db) {
      throw new Error("Firebase db is not initialized")
    }

    try {
      await updateDoc(doc(db, "users", uid), {
        walletAddress,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Update wallet address error:", error)
      throw error
    }
  }

  static async resendVerificationEmail(): Promise<void> {
    if (!auth || !auth.currentUser) {
      throw new Error("No user is currently signed in")
    }

    try {
      await sendEmailVerification(auth.currentUser)
    } catch (error) {
      console.error("Resend verification email error:", error)
      throw error
    }
  }

  static async checkEmailVerificationStatus(): Promise<boolean> {
    if (!auth || !auth.currentUser) {
      throw new Error("No user is currently signed in")
    }

    try {
      // Reload user to get the latest email verification status
      await auth.currentUser.reload()
      return auth.currentUser.emailVerified
    } catch (error) {
      console.error("Check email verification status error:", error)
      throw error
    }
  }
}
