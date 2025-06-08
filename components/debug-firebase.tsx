"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"

export function DebugFirebase() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    const checkFirebaseConnection = async () => {
      try {
        // Check Firebase Auth
        const authUser = auth?.currentUser

        setDebugInfo({
          authConnected: !!auth,
          firestoreConnected: !!db,
          currentUser: authUser?.uid || null,
          projectId: auth?.app?.options?.projectId,
          authDomain: auth?.app?.options?.authDomain,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Firebase debug error:", error)
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    checkFirebaseConnection()
  }, [])

  // Only show in development, but check in a client-safe way
  const isDevelopment =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

  if (!isDevelopment) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-3 rounded text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Firebase Debug</h4>
      <pre className="text-xs overflow-auto max-h-32">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  )
}
