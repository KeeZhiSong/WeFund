"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, XIcon as XRP, AlertCircle, CheckCircle } from "lucide-react"
import { DebugFirebase } from "@/components/debug-firebase"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface FormData {
  email: string
  password: string
  displayName?: string
  confirmPassword?: string
}

interface FormErrors {
  email?: string
  password?: string
  displayName?: string
  confirmPassword?: string
  general?: string
}

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [successMessage, setSuccessMessage] = useState("")

  // Form data state
  const [loginData, setLoginData] = useState<FormData>({
    email: "",
    password: "",
  })

  const [signupData, setSignupData] = useState<FormData>({
    email: "",
    password: "",
    displayName: "",
    confirmPassword: "",
  })

  // Error states
  const [loginErrors, setLoginErrors] = useState<FormErrors>({})
  const [signupErrors, setSignupErrors] = useState<FormErrors>({})

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email is required"
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters long"
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain at least one special character"
    return undefined
  }

  const validateDisplayName = (name: string): string | undefined => {
    if (!name) return "Full name is required"
    if (name.length < 2) return "Name must be at least 2 characters long"
    if (name.length > 50) return "Name must be less than 50 characters"
    return undefined
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return "Please confirm your password"
    if (password !== confirmPassword) return "Passwords do not match"
    return undefined
  }

  // Handle input changes
  const handleLoginChange = (field: keyof FormData, value: string | boolean) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (loginErrors[field as keyof FormErrors]) {
      setLoginErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSignupChange = (field: keyof FormData, value: string | boolean) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (signupErrors[field as keyof FormErrors]) {
      setSignupErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Validate forms
  const validateLoginForm = (): boolean => {
    const errors: FormErrors = {}

    const emailError = validateEmail(loginData.email)
    if (emailError) errors.email = emailError

    if (!loginData.password) errors.password = "Password is required"

    setLoginErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateSignupForm = (): boolean => {
    const errors: FormErrors = {}

    const emailError = validateEmail(signupData.email)
    if (emailError) errors.email = emailError

    const passwordError = validatePassword(signupData.password!)
    if (passwordError) errors.password = passwordError

    const nameError = validateDisplayName(signupData.displayName!)
    if (nameError) errors.displayName = nameError

    const confirmPasswordError = validateConfirmPassword(signupData.password!, signupData.confirmPassword!)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

    setSignupErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    setIsLoading(true)
    setLoginErrors({})

    try {
      await signIn(loginData.email, loginData.password)

      setSuccessMessage("Login successful! Redirecting...")

      // Redirect after short delay to show success message
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle specific Firebase auth errors
      let errorMessage = "An error occurred during login. Please try again."

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format."
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Please contact support."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again."
      }

      setLoginErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateSignupForm()) return

    setIsLoading(true)
    setSignupErrors({})

    try {
      console.log("Starting signup process...")
      await signUp(signupData.email, signupData.password!, signupData.displayName!)
      console.log("Signup successful!")

      setSuccessMessage(
        "Account created successfully! Please check your email to verify your account before continuing.",
      )

      // Don't redirect immediately - let user see the success message and verification banner
      // They'll be redirected after email verification
    } catch (error: any) {
      console.error("Signup error:", error)

      let errorMessage = "An error occurred during registration. Please try again."

      // Handle the error message from our AuthService
      if (error.message) {
        errorMessage = error.message
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists. Please sign in instead."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format."
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled. Please contact support."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again."
      }

      setSignupErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  // Clear messages when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSuccessMessage("")
    setLoginErrors({})
    setSignupErrors({})
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
        <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 px-6">
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
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">{successMessage}</span>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-2 mb-8 bg-white/90 backdrop-blur-md">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card className="border-slate-200 bg-white/95 backdrop-blur-md shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-800">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      {/* General Error */}
                      {loginErrors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-800 text-sm">{loginErrors.general}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={loginData.email}
                            onChange={(e) => handleLoginChange("email", e.target.value)}
                            className={`pl-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              loginErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                            }`}
                            required
                          />
                        </div>
                        {loginErrors.email && <p className="text-red-600 text-sm">{loginErrors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <Link
                            href="/auth/reset-password"
                            className="text-sm text-slate-500 hover:text-teal-600"
                            style={{ color: "#3CAEA3" }}
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => handleLoginChange("password", e.target.value)}
                            className={`pl-10 pr-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              loginErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-800"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {loginErrors.password && <p className="text-red-600 text-sm">{loginErrors.password}</p>}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full text-white"
                        disabled={isLoading}
                        style={{ backgroundColor: "#FF6F61" }}
                      >
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup">
                <Card className="border-slate-200 bg-white/95 backdrop-blur-md shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-slate-800">Create an account</CardTitle>
                    <CardDescription>Enter your information to get started</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4">
                      {/* General Error */}
                      {signupErrors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-800 text-sm">{signupErrors.general}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="fullname"
                            type="text"
                            placeholder="John Doe"
                            value={signupData.displayName}
                            onChange={(e) => handleSignupChange("displayName", e.target.value)}
                            className={`pl-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              signupErrors.displayName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                            }`}
                            required
                          />
                        </div>
                        {signupErrors.displayName && <p className="text-red-600 text-sm">{signupErrors.displayName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="name@example.com"
                            value={signupData.email}
                            onChange={(e) => handleSignupChange("email", e.target.value)}
                            className={`pl-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              signupErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                            }`}
                            required
                          />
                        </div>
                        {signupErrors.email && <p className="text-red-600 text-sm">{signupErrors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupData.password}
                            onChange={(e) => handleSignupChange("password", e.target.value)}
                            className={`pl-10 pr-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              signupErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-800"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Requirements Note */}
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                          <p className="font-medium mb-1">Password must contain:</p>
                          <ul className="space-y-0.5 text-xs">
                            <li>• At least 8 characters</li>
                            <li>• One uppercase letter (A-Z)</li>
                            <li>• One lowercase letter (a-z)</li>
                            <li>• One number (0-9)</li>
                            <li>• One special character (@$!%*?&)</li>
                          </ul>
                        </div>

                        {signupErrors.password && <p className="text-red-600 text-sm">{signupErrors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupData.confirmPassword}
                            onChange={(e) => handleSignupChange("confirmPassword", e.target.value)}
                            className={`pl-10 pr-10 bg-white/90 border-slate-300 text-slate-800 focus:border-teal-500 focus:ring-teal-500 ${
                              signupErrors.confirmPassword
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={toggleConfirmPasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-800"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {signupErrors.confirmPassword && (
                          <p className="text-red-600 text-sm">{signupErrors.confirmPassword}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full text-white"
                        disabled={isLoading}
                        style={{ backgroundColor: "#FF6F61" }}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>

            {/* XRPL Integration Notice */}
            <div className="mt-8 p-4 bg-white/90 backdrop-blur-md border border-teal-200 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full" style={{ backgroundColor: "#3CAEA3" }}>
                  <XRP className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800">XRPL Integration</h3>
                  <p className="text-xs text-slate-600">
                    Connect your XRPL wallet after signup for seamless donations and campaign management on WeFund
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-slate-500">
            <p>© 2025 WeFund. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <Link href="/terms" className="hover:text-teal-600" style={{ color: "#3CAEA3" }}>
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-teal-600" style={{ color: "#3CAEA3" }}>
                Privacy
              </Link>
              <Link href="/help" className="hover:text-teal-600" style={{ color: "#3CAEA3" }}>
                Help
              </Link>
            </div>
          </div>
        </footer>

        {/* Debug Component - Development Only */}
        <DebugFirebase />
      </div>
    </div>
  )
}
