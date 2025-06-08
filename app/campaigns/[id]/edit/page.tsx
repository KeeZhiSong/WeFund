"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ImageUpload } from "@/components/ui/image-upload"
import { CampaignService } from "@/services/firebase-campaigns"
import { useAuth } from "@/contexts/auth-context"
import type { Campaign } from "@/types/database"
import { FirebaseStorageService } from "@/lib/firebase-storage"

const CampaignEditPage = () => {
  const router = useRouter()
  const { id } = useParams()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [goal, setGoal] = useState("")
  const [category, setCategory] = useState<"Medical" | "Community" | "Business" | "Education">("Medical")
  const [status, setStatus] = useState<"active" | "completed" | "paused">("active")
  const [endDate, setEndDate] = useState("")

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id || typeof id !== "string") return

      try {
        setLoading(true)
        const campaignData = await CampaignService.getCampaignById(id)

        if (!campaignData) {
          alert("Campaign not found")
          router.push("/campaigns")
          return
        }

        // Check if user owns this campaign
        if (campaignData.creatorId !== user?.uid) {
          alert("You don't have permission to edit this campaign")
          router.push("/campaigns")
          return
        }

        setCampaign(campaignData)
        setTitle(campaignData.title)
        setDescription(campaignData.description)
        setGoal(campaignData.goal.toString())
        setCategory(campaignData.category)
        setStatus(campaignData.status)
        setEndDate(campaignData.endDate.toISOString().split("T")[0])
      } catch (error) {
        console.error("Error fetching campaign:", error)
        alert("Error loading campaign")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCampaign()
    }
  }, [id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaign || !user) return

    try {
      setSaving(true)
      setUploading(true)

      let imageUrl = campaign.image

      // Upload new image if one was selected
      if (imageFile) {
        try {
          const uploadResult = await FirebaseStorageService.uploadCampaignPicture(campaign.id, imageFile)
          imageUrl = uploadResult.url
          console.log("Image uploaded successfully:", uploadResult.url)
        } catch (imageError) {
          console.error("Image upload failed:", imageError)
          // Continue with campaign update even if image upload fails
        }
      }

      setUploading(false)

      const updates = {
        title,
        description,
        goal: Number.parseFloat(goal),
        category,
        status,
        endDate: new Date(endDate),
        image: imageUrl,
      }

      await CampaignService.updateCampaign(campaign.id, updates)

      // Show success message
      const successDiv = document.createElement("div")
      successDiv.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
      successDiv.textContent = "Campaign updated successfully!"
      document.body.appendChild(successDiv)

      setTimeout(() => {
        document.body.removeChild(successDiv)
        router.push(`/campaigns/${campaign.id}`)
      }, 2000)
    } catch (error: any) {
      console.error("Error updating campaign:", error)

      // Show detailed error message
      const errorDiv = document.createElement("div")
      errorDiv.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md"
      errorDiv.innerHTML = `
      <div class="font-semibold">Update Failed</div>
      <div class="text-sm mt-1">${error.message}</div>
    `
      document.body.appendChild(errorDiv)

      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv)
        }
      }, 5000)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return

    if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return
    }

    try {
      setDeleting(true)
      await CampaignService.deleteCampaign(campaign.id)

      // Show success message
      const successDiv = document.createElement("div")
      successDiv.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
      successDiv.textContent = "Campaign deleted successfully!"
      document.body.appendChild(successDiv)

      setTimeout(() => {
        document.body.removeChild(successDiv)
        router.push("/campaigns")
      }, 2000)
    } catch (error: any) {
      console.error("Error deleting campaign:", error)

      // Show detailed error message
      const errorDiv = document.createElement("div")
      errorDiv.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md"
      errorDiv.innerHTML = `
      <div class="font-semibold">Delete Failed</div>
      <div class="text-sm mt-1">${error.message}</div>
    `
      document.body.appendChild(errorDiv)

      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv)
        }
      }, 5000)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
              <p className="text-gray-600 mt-1">Update your campaign details and settings</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Campaign
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Campaign Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                        Campaign Title
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="Enter campaign title"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        placeholder="Describe your campaign"
                        rows={4}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="image" className="text-sm font-semibold text-gray-700">
                        Campaign Cover Image
                      </Label>
                      <ImageUpload
                        value={campaign?.image || ""}
                        onChange={(file) => setImageFile(file)}
                        disabled={saving || uploading}
                      />
                      <p className="text-xs text-gray-500">
                        Upload a cover image for your campaign. Recommended size: 600x400px
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goal" className="text-sm font-semibold text-gray-700">
                        Funding Goal (XRP)
                      </Label>
                      <div className="relative">
                        <Input
                          id="goal"
                          type="number"
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          required
                          min="1"
                          step="0.01"
                          placeholder="Enter funding goal"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">XRP</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                        Category
                      </Label>
                      <Select
                        value={category}
                        onValueChange={(value: "Medical" | "Community" | "Business" | "Education") =>
                          setCategory(value)
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Medical">🏥 Medical</SelectItem>
                          <SelectItem value="Community">🏘️ Community</SelectItem>
                          <SelectItem value="Business">💼 Business</SelectItem>
                          <SelectItem value="Education">🎓 Education</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={status}
                        onValueChange={(value: "active" | "completed" | "paused") => setStatus(value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">✅ Active</SelectItem>
                          <SelectItem value="paused">⏸️ Paused</SelectItem>
                          <SelectItem value="completed">🎉 Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={saving || uploading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5"
                    >
                      {uploading ? (
                        <>
                          <LoadingSpinner />
                          <span className="ml-2">Uploading Image...</span>
                        </>
                      ) : saving ? (
                        <>
                          <LoadingSpinner />
                          <span className="ml-2">Updating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Campaign
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Preview */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 truncate">{title || "Campaign Title"}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {description || "Campaign description will appear here..."}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Goal:</span>
                    <span className="font-semibold text-green-600">{goal ? `${goal} XRP` : "0 XRP"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`font-medium ${
                        status === "active"
                          ? "text-green-600"
                          : status === "paused"
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/campaigns")}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  All Campaigns
                </Button>
              </CardContent>
            </Card>

            {/* Debug Info (only show in development) */}
            {process.env.NODE_ENV === "development" && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Debug Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>Campaign ID:</strong> {campaign.id}
                    </div>
                    <div>
                      <strong>Creator ID:</strong> {campaign.creatorId}
                    </div>
                    <div>
                      <strong>Current User:</strong> {user?.uid || "Not logged in"}
                    </div>
                    <div>
                      <strong>User Email:</strong> {user?.email || "N/A"}
                    </div>
                    <div>
                      <strong>Is Owner:</strong> {campaign.creatorId === user?.uid ? "Yes" : "No"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a campaign, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignEditPage
