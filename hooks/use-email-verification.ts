"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

const useEmailVerification = () => {
  const [verified, setVerified] = useState<boolean | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      verifyEmail(token)
    } else {
      setVerified(false) // No token, so not verified
    }
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setVerified(true)
        alert("Email verified successfully!")
      } else {
        const errorData = await response.json()
        setVerified(false)
        console.error("Email verification failed:", errorData.message)
        alert(`Email verification failed: ${errorData.message}`)
      }
    } catch (error: any) {
      setVerified(false)
      console.error("Email verification error:", error)
      alert(`Email verification error: ${error.message}`)
    }
  }

  return { verified }
}

export default useEmailVerification
