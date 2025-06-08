"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, DollarSign, FileText, Wallet, AlertTriangle } from "lucide-react"
import ImageUpload from "@/components/ui/image-upload"
import { FirebaseStorageService } from "@/lib/firebase-storage"

export default function CreateCampaignPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    category: "",
    endDate: "",
    walletAddress: "",
    images: [] as string[],
    imageFile: null as File | null,
  })

  // Add a loading state for image upload
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Add this function to handle image upload
  const handleImageChange = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
    }))
    setImageUploadError(null) // Clear any previous errors
  }

  const validateWalletAddress = (address: string): boolean => {
    // Basic XRPL address validation
    if (!address) return false

    // XRPL addresses start with 'r' and are typically 25-34 characters long
    const xrplRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/
    return xrplRegex.test(address)
  }

  // Update the handleSubmit function to include image upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("You must be signed in to create a campaign")
      return
    }

    if (!formData.title || !formData.description || !formData.goal) {
      alert("Please fill in all required fields")
      return
    }

    if (formData.walletAddress && !validateWalletAddress(formData.walletAddress)) {
      alert("Please enter a valid XRPL wallet address (must start with 'r' and be 25-34 characters long)")
      return
    }

    setLoading(true)
    setImageUploadError(null)

    try {
      // Upload image if provided
      let imageUrl = "/placeholder.svg?height=400&width=600"
      let imagePath = ""

      if (formData.imageFile) {
        setImageUploading(true)
        try {
          // Generate a unique campaign ID for the image
          const tempCampaignId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const uploadResult = await FirebaseStorageService.uploadCampaignPicture(tempCampaignId, formData.imageFile)
          imageUrl = uploadResult.url
          imagePath = uploadResult.path
          console.log("Image uploaded successfully:", uploadResult)
        } catch (imageError: any) {
          console.error("Error uploading image:", imageError)
          setImageUploadError(`Image upload failed: ${imageError.message}`)

          // Show user-friendly error message but continue with campaign creation
          const errorMessage = imageError.message.includes("unauthorized")
            ? "Image upload failed due to permissions. The campaign will be created with a placeholder image. You can update the image later."
            : `Image upload failed: ${imageError.message}. The campaign will be created with a placeholder image.`

          // Create a toast-like notification
          const errorDiv = document.createElement("div")
          errorDiv.className =
            "fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md"
          errorDiv.innerHTML = `
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <div class="font-semibold">Image Upload Warning</div>
                <div class="text-sm mt-1">${errorMessage}</div>
              </div>
            </div>
          `
          document.body.appendChild(errorDiv)

          setTimeout(() => {
            if (document.body.contains(errorDiv)) {
              document.body.removeChild(errorDiv)
            }
          }, 8000)
        } finally {
          setImageUploading(false)
        }
      }

      const campaignData = {
        title: formData.title,
        description: formData.description,
        goal: Number.parseFloat(formData.goal),
        category: formData.category || "Other",
        endDate: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        // Only include walletAddress if it's not empty
        ...(formData.walletAddress && { walletAddress: formData.walletAddress }),
        images: formData.images,
        image: imageUrl,
        // Only include imageId if it exists
        ...(imagePath && { imageId: imagePath }),
        creatorId: user.uid,
        creatorName: user.displayName || user.email || "Anonymous",
        status: "active" as const,
        raised: 0,
        donorCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await CampaignService.createCampaign(campaignData)

      // Show success message
      const successDiv = document.createElement("div")
      successDiv.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
      successDiv.textContent = "Campaign created successfully!"
      document.body.appendChild(successDiv)

      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv)
        }
        router.push("/campaigns")
      }, 2000)
    } catch (error) {
      console.error("Error creating campaign:", error)
      alert("Failed to create campaign. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                <p className="text-gray-600 mb-6">You must be signed in to create a campaign.</p>
                <Button onClick={() => router.push("/auth")}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="text-gray-600 mt-2">Start your crowdfunding journey and bring your project to life.</p>
          </div>

          {/* Firebase Storage Warning */}
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Image Upload Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    If image upload fails due to Firebase permissions, your campaign will be created with a placeholder
                    image. You can update the image later through the campaign edit page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your campaign title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your campaign, its goals, and why people should support it..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal">Funding Goal (XRP) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="goal"
                        type="number"
                        placeholder="0.00"
                        value={formData.goal}
                        onChange={(e) => handleInputChange("goal", e.target.value)}
                        className="pl-10"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Arts">Arts & Culture</SelectItem>
                        <SelectItem value="Community">Community</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletAddress">XRPL Wallet Address</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="walletAddress"
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (optional)"
                      value={formData.walletAddress}
                      onChange={(e) => handleInputChange("walletAddress", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter your XRPL wallet address to receive donations directly. Must start with 'r' and be 25-34
                    characters long.
                  </p>
                  {formData.walletAddress && !validateWalletAddress(formData.walletAddress) && (
                    <p className="text-sm text-red-500">Invalid XRPL wallet address format</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignImage">Campaign Cover Image</Label>
                  <ImageUpload
                    onChange={handleImageChange}
                    value={formData.imageFile ? URL.createObjectURL(formData.imageFile) : ""}
                    disabled={loading || imageUploading}
                  />
                  <p className="text-sm text-gray-500">
                    Upload an image for your campaign (max 10MB). This will be the main image shown to potential donors.
                  </p>
                  {imageUploading && <p className="text-sm text-amber-500">Uploading image...</p>}
                  {imageUploadError && <p className="text-sm text-red-500">⚠️ {imageUploadError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Campaign End Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <p className="text-sm text-gray-500">If not specified, campaign will run for 30 days</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/campaigns")} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating Campaign..." : "Create Campaign"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
