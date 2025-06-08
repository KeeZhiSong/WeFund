"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/services/firebase-auth"
import { useAuth } from "@/contexts/auth-context"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, checkEmailVerification } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "already-verified" | "manual-check"
  >("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  const actionCode = searchParams.get("oobCode")
  const mode = searchParams.get("mode")
  const continueUrl = searchParams.get("continueUrl")

  useEffect(() => {
    const handleVerification = async () => {
      // If user is already verified, show success
      if (user?.isVerified) {
        setVerificationStatus("already-verified")
        return
      }

      // If we have an action code and mode is verifyEmail, process it
      if (actionCode && mode === "verifyEmail") {
        try {
          await AuthService.verifyEmailWithCode(actionCode)
          setVerificationStatus("success")

          // Redirect after 3 seconds
          setTimeout(() => {
            router.push(continueUrl || "/dashboard")
          }, 3000)
        } catch (error: any) {
          console.error("Email verification error:", error)
          setVerificationStatus("error")

          let errorMsg = "Failed to verify email. Please try again."

          if (error.message) {
            errorMsg = error.message
          } else if (error.code === "auth/invalid-action-code") {
            errorMsg = "This verification link is invalid or has expired. Please request a new one."
          } else if (error.code === "auth/expired-action-code") {
            errorMsg = "This verification link has expired. Please request a new verification email."
          } else if (error.code === "auth/user-disabled") {
            errorMsg = "This account has been disabled. Please contact support."
          }

          setErrorMessage(errorMsg)
        }
      } else {
        // No action code, show manual check option
        setVerificationStatus("manual-check")
      }
    }

    handleVerification()
  }, [actionCode, mode, continueUrl, router, user])

  const handleResendVerification = async () => {
    setIsResending(true)

    try {
      await AuthService.resendVerificationEmail()
      setErrorMessage("A new verification email has been sent to your inbox. Please check your email and spam folder.")
    } catch (error: any) {
      console.error("Resend verification error:", error)
      setErrorMessage(error.message || "Failed to resend verification email. Please try again later.")
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerificationStatus = async () => {
    setIsCheckingStatus(true)

    try {
      const isVerified = await checkEmailVerification()
      if (isVerified) {
        setVerificationStatus("success")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setErrorMessage("Email is not yet verified. Please check your email and click the verification link.")
      }
    } catch (error: any) {
      console.error("Check verification status error:", error)
      setErrorMessage("Failed to check verification status. Please try again.")
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-xl">Verifying Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </CardHeader>
          </Card>
        )

      case "success":
        return (
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-800">Email Verified!</CardTitle>
              <CardDescription>
                Your email address has been successfully verified. You now have full access to all features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-600 mb-4">Redirecting you to the dashboard in a few seconds...</p>
              <Button
                onClick={() => router.push(continueUrl || "/dashboard")}
                className="w-full"
                style={{ backgroundColor: "#3CAEA3" }}
              >
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        )

      case "already-verified":
        return (
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-800">Already Verified</CardTitle>
              <CardDescription>
                Your email address is already verified. You have full access to all features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
                style={{ backgroundColor: "#3CAEA3" }}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )

      case "manual-check":
        return (
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification email to your address. Please click the link in the email to verify your
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  After clicking the verification link in your email, you can check your verification status here.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                </div>
              )}

              <Button
                onClick={handleCheckVerificationStatus}
                disabled={isCheckingStatus}
                className="w-full"
                style={{ backgroundColor: "#3CAEA3" }}
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "I've Verified My Email"
                )}
              </Button>

              {user && !user.isVerified && (
                <Button onClick={handleResendVerification} disabled={isResending} className="w-full" variant="outline">
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}

              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                Continue Without Verification
              </Button>
            </CardContent>
          </Card>
        )

      case "error":
        return (
          <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md shadow-xl border-slate-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">Verification Failed</CardTitle>
              <CardDescription className="text-red-600">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && !user.isVerified && (
                <Button onClick={handleResendVerification} disabled={isResending} className="w-full" variant="outline">
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}

              <Button onClick={() => router.push("/auth")} variant="outline" className="w-full">
                Back to Sign In
              </Button>

              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/charity-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/images/wefund-icon.png" alt="WeFund Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-slate-800">WeFund</span>
            </Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">{renderContent()}</main>

        {/* Footer */}
        <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
            <p>© 2025 WeFund. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
