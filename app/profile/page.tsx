"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Camera, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { ImageService } from "@/services/image-service"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
  })

  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: "",
        location: "",
        website: "",
        phone: "",
      })
    }
  }, [user])

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (user) {
        try {
          const profilePic = await ImageService.getUserProfilePicture(user.uid)
          if (profilePic) {
            setProfilePicture(profilePic.url)
          }
        } catch (error) {
          console.error("Error loading profile picture:", error)
        }
      }
    }
    loadProfilePicture()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfilePictureUpload = async (file: File) => {
    if (!user) return

    setUploadingPicture(true)
    try {
      const result = await ImageService.uploadProfilePicture(user.uid, file)
      setProfilePicture(result.url)

      alert("Profile picture updated successfully!")
    } catch (error) {
      console.error("Profile picture upload error:", error)
      alert("Failed to upload profile picture. Please try again.")
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.")
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.")
        return
      }

      handleProfilePictureUpload(file)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert("Profile updated successfully!")
    } catch (error) {
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4">Please sign in to access your profile.</p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
        style={{
          backgroundImage: "url('/images/crowdfunding-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
            <p className="text-slate-600">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profilePicture || "/placeholder.svg?height=128&width=128"} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                    {user.displayName?.charAt(0) || user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
              <p className="text-sm text-slate-600 mb-4">Click the camera icon to upload a new profile picture</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
              >
                {uploadingPicture ? "Uploading..." : "Upload New Picture"}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">Email cannot be changed here</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-slate-600">Account Created</Label>
                <p className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Last Updated</Label>
                <p className="font-medium">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Email Verified</Label>
                <p className="font-medium">
                  {user.isVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-orange-600">⚠ Not Verified</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
              <div>
                <Label className="text-slate-600">Account Role</Label>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
              <div>
                <Label className="text-slate-600">Total Campaigns</Label>
                <p className="font-medium">{user.campaignsCreated || 0}</p>
              </div>
              <div>
                <Label className="text-slate-600">Total Donations</Label>
                <p className="font-medium">{user.donationsCount || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <Label className="text-slate-600">Total Donated</Label>
                <p className="font-medium text-green-600">
                  ${user.totalDonated ? user.totalDonated.toFixed(2) : "0.00"}
                </p>
              </div>
              <div>
                <Label className="text-slate-600">Total Raised</Label>
                <p className="font-medium text-blue-600">${user.totalRaised ? user.totalRaised.toFixed(2) : "0.00"}</p>
              </div>
            </div>

            {user.walletAddress && (
              <div className="mt-4">
                <Label className="text-slate-600">Connected Wallet</Label>
                <p className="font-mono text-sm bg-slate-100 p-2 rounded break-all">{user.walletAddress}</p>
              </div>
            )}

            {!user.isVerified && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">⚠</span>
                  <p className="text-orange-800 font-medium">Email Verification Required</p>
                </div>
                <p className="text-orange-700 text-sm mt-1">
                  Please verify your email address to access all platform features.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={async () => {
                    try {
                      // You can add resend verification email functionality here
                      alert("Verification email sent. Please check your email for verification instructions.")
                    } catch (error) {
                      alert("Failed to send verification email.")
                    }
                  }}
                >
                  Resend Verification Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
