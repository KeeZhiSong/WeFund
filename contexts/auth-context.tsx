"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface User {
  uid: string
  email: string
  displayName: string | null
  isVerified: boolean
  role: string
  createdAt: Date | null
  updatedAt: Date | null
  walletAddress?: string
  campaignsCreated?: number
  donationsCount?: number
  totalDonated?: number
  totalRaised?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendEmailVerification: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updateUserProfile: (displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return
    if (!auth) {
      console.error("Firebase auth is not initialized")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          if (!db) {
            console.error("Firebase db is not initialized")
            setLoading(false)
            return
          }

          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName,
              isVerified: firebaseUser.emailVerified,
              role: userData.role || "user",
              createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()) : null,
              updatedAt: userData.updatedAt ? new Date(userData.updatedAt.toDate()) : null,
              walletAddress: userData.walletAddress,
              campaignsCreated: userData.campaignsCreated,
              donationsCount: userData.donationsCount,
              totalDonated: userData.totalDonated,
              totalRaised: userData.totalRaised,
            })
          } else {
            // If user document doesn't exist in Firestore, create it
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName,
              isVerified: firebaseUser.emailVerified,
              role: "user",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            await setDoc(doc(db, "users", firebaseUser.uid), newUser)
            setUser(newUser)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error("Error in auth state change:", err)
        setError("Failed to load user data")
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth || !db) {
      throw new Error("Firebase is not initialized")
    }

    try {
      setLoading(true)
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name
      await updateProfile(userCredential.user, { displayName })

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        isVerified: false,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Send email verification
      await firebaseSendEmailVerification(userCredential.user)
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized")
    }

    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized")
    }

    try {
      setLoading(true)
      setError(null)
      await firebaseSignOut(auth)
    } catch (err: any) {
      console.error("Sign out error:", err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const sendEmailVerification = async () => {
    if (!auth || !auth.currentUser) {
      throw new Error("No user is currently signed in")
    }

    try {
      await firebaseSendEmailVerification(auth.currentUser)
    } catch (err: any) {
      console.error("Email verification error:", err)
      throw err
    }
  }

  const sendPasswordReset = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase auth is not initialized")
    }

    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: any) {
      console.error("Password reset error:", err)
      throw err
    }
  }

  const updateUserProfile = async (displayName: string) => {
    if (!auth || !auth.currentUser || !db) {
      throw new Error("Firebase is not initialized or no user is signed in")
    }

    try {
      await updateProfile(auth.currentUser, { displayName })

      // Update Firestore document
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName,
        updatedAt: new Date(),
      })

      // Update local state
      if (user) {
        setUser({
          ...user,
          displayName,
        })
      }
    } catch (err: any) {
      console.error("Profile update error:", err)
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    sendEmailVerification,
    sendPasswordReset,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
