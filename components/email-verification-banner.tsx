"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function EmailVerificationBanner() {
  const { user, sendEmailVerification } = useAuth()
  const [isSending, setIsSending] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  // Don't show the banner if user is not logged in or email is already verified
  if (!user || user.isVerified) {
    return null
  }

  const handleSendVerification = async () => {
    setIsSending(true)
    try {
      await sendEmailVerification()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000) // Hide success message after 5 seconds
    } catch (error) {
      console.error("Error sending verification email:", error)
      alert("Failed to send verification email. Please try again later.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Alert className="mb-6 border-amber-500 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-800">Verify your email address</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-amber-700">Please verify your email address to access all features of the platform.</div>
        <div className="flex items-center gap-2">
          {showSuccess && <span className="text-green-600 text-sm">Verification email sent!</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendVerification}
            disabled={isSending}
            className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
          >
            {isSending ? "Sending..." : "Send Verification Email"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
