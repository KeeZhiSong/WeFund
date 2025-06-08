"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Users,
  Shield,
  Copy,
  ExternalLink,
  User,
  Clock,
  DollarSign,
  Edit,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import type { Campaign } from "@/types/database"
import { Sidebar } from "@/components/sidebar"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { safeToDate } from "@/lib/date-utils"

// Mock campaign data for fallback
const mockCampaign: Campaign = {
  id: "mock-campaign",
  title: "Help Fund Medical Research",
  description: "This campaign aims to fund important medical research for rare diseases.",
  goal: 10000,
  raised: 3500,
  donors: 42,
  daysLeft: 15,
  image: "/placeholder.svg?height=400&width=600",
  category: "Medical",
  status: "active",
  creatorId: "mock-user",
  walletAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
  createdAt: new Date(),
  updatedAt: new Date(),
  endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllDonations, setShowAllDonations] = useState(false)
  const [donations, setDonations] = useState<any[]>([])
  const [loadingDonations, setLoadingDonations] = useState(true)

  const campaignId = params.id as string

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError(null)

        // Direct Firestore access instead of using the service
        if (typeof window !== "undefined" && campaignId) {
          try {
            const docRef = doc(db, "campaigns", campaignId)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
              const data = docSnap.data()
              const campaign: Campaign = {
                id: docSnap.id,
                ...data,
                createdAt: safeToDate(data.createdAt),
                updatedAt: safeToDate(data.updatedAt),
                endDate: safeToDate(data.endDate),
              } as Campaign

              setCampaign(campaign)
            } else {
              console.log("No such campaign!")
              // Use mock data as fallback
              setCampaign(mockCampaign)
            }
          } catch (err) {
            console.error("Error fetching campaign:", err)
            // Use mock data as fallback
            setCampaign(mockCampaign)
          }
        } else {
          // Use mock data as fallback when not in browser or no ID
          setCampaign(mockCampaign)
        }
      } catch (error) {
        console.error("Error in campaign fetch:", error)
        // Use mock data as fallback
        setCampaign(mockCampaign)
      } finally {
        setLoading(false)
      }
    }

    const fetchDonations = async () => {
      try {
        setLoadingDonations(true)
        if (typeof window !== "undefined" && campaignId) {
          const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")

          // Fetch ALL donations for this campaign to calculate accurate totals
          const q = query(
            collection(db, "donations"),
            where("campaignId", "==", campaignId),
            orderBy("createdAt", "desc"),
          )

          const querySnapshot = await getDocs(q)
          const donationsList = querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            }
          })

          setDonations(donationsList)
        }
      } catch (error) {
        console.error("Error fetching donations:", error)
        setDonations([])
      } finally {
        setLoadingDonations(false)
      }
    }

    fetchCampaign()
    fetchDonations()
  }, [campaignId])

  const copyWalletAddress = () => {
    if (campaign?.walletAddress) {
      navigator.clipboard.writeText(campaign.walletAddress)
      alert("Wallet address copied to clipboard!")
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Medical: "text-red-600 border-red-200 bg-red-50",
      Community: "text-blue-600 border-blue-200 bg-blue-50",
      Business: "text-green-600 border-green-200 bg-green-50",
      Education: "text-amber-600 border-amber-200 bg-amber-50",
    }
    return colors[category as keyof typeof colors] || "text-gray-600 border-gray-200 bg-gray-50"
  }

  const handleDonateClick = () => {
    router.push(`/donate/${campaignId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-96 bg-slate-200 rounded-lg mb-6"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-slate-200 rounded-lg"></div>
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">{error || "Campaign Not Found"}</h1>
            <p className="text-slate-600 mb-6">
              {error || "The campaign you're looking for doesn't exist or has been removed."}
            </p>
            <Link href="/campaigns">
              <Button className="text-white" style={{ backgroundColor: "#3CAEA3" }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Calculate actual raised amount from donations
  const actualRaisedAmount = donations.reduce((total, donation) => total + (donation.amount || 0), 0)
  const progressPercentage = Math.min((actualRaisedAmount / campaign.goal) * 100, 100)
  const visibleDonations = showAllDonations ? donations : donations.slice(0, 3)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/campaigns" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Campaigns</span>
            </Link>

            {/* Edit button - only show for campaign creator */}
            {user && campaign && user.uid === campaign.creatorId && (
              <Link href={`/campaigns/${campaign.id}/edit`}>
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Campaign
                </Button>
              </Link>
            )}
          </div>

          <EmailVerificationBanner />

          <h1 className="text-3xl font-bold text-slate-800 mb-2">{campaign.title}</h1>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            <div className="relative">
              <Image
                src={campaign.image || "/placeholder.svg?height=400&width=600"}
                alt={campaign.title}
                width={600}
                height={400}
                className="w-full h-96 object-cover rounded-lg"
              />
              <Badge className={`absolute top-4 left-4 ${getCategoryColor(campaign.category)}`}>
                {campaign.category}
              </Badge>
            </div>

            {/* Organizer Info */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-teal-100 text-teal-700">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Campaign Organizer</span> is organizing this
                      fundraiser.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Description */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">About this campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </CardContent>
            </Card>

            {/* XRPL Wallet Info */}
            {campaign.walletAddress && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-600" />
                    XRPL Wallet Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Donation Wallet Address</p>
                        <p className="text-xs font-mono text-slate-600 break-all">{campaign.walletAddress}</p>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                onClick={copyWalletAddress}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy wallet address</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                onClick={() =>
                                  window.open(`https://livenet.xrpl.org/accounts/${campaign.walletAddress}`, "_blank")
                                }
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View on XRPL Explorer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="w-3 h-3" />
                      <span>All donations are secured by the XRP Ledger blockchain</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Donation Info */}
          <div className="space-y-6">
            {/* Fundraising Stats */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-slate-800 mb-1">
                    {actualRaisedAmount.toLocaleString()} XRP
                  </div>
                  <div className="text-sm text-slate-600 mb-8">
                    raised of {(campaign.goal || 0).toLocaleString()} XRP target
                  </div>

                  <div className="relative mb-4">
                    <Progress value={progressPercentage} className="h-3" />
                    <div
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 rounded-full w-12 h-12 flex items-center justify-center shadow-sm"
                      style={{ left: `${Math.min(progressPercentage, 90)}%` }}
                    >
                      <span className="text-xs font-bold" style={{ color: "#3CAEA3" }}>
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center text-sm text-slate-600 mb-6">
                    <div>
                      <div className="font-bold text-slate-800">{donations.length}</div>
                      <div>donations</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {campaign.endDate
                          ? (() => {
                              const endDate = new Date(campaign.endDate)
                              const today = new Date()
                              const diffTime = endDate.getTime() - today.getTime()
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                              return diffDays > 0 ? diffDays : 0
                            })()
                          : campaign.daysLeft || 0}
                      </div>
                      <div>
                        {campaign.endDate
                          ? (() => {
                              const endDate = new Date(campaign.endDate)
                              const today = new Date()
                              const diffTime = endDate.getTime() - today.getTime()
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                              return diffDays > 0 ? "days left" : diffDays === 0 ? "ends today" : "ended"
                            })()
                          : "days left"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full text-white font-medium py-3"
                    style={{ backgroundColor: "#FF6F61" }}
                    size="lg"
                    onClick={handleDonateClick}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Donate now
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                    size="lg"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>

                  <Button variant="ghost" className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                    <Heart className="w-4 h-4 mr-2" />
                    Add to favorites
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Recent donations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {loadingDonations ? (
                    <div className="p-4 text-center text-slate-500">Loading donations...</div>
                  ) : visibleDonations.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No donations yet</div>
                  ) : (
                    visibleDonations.map((donation, index) => (
                      <div
                        key={donation.id}
                        className={`p-4 ${index !== visibleDonations.length - 1 ? "border-b border-slate-100" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" />
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                              {donation.donorName ? donation.donorName.charAt(0) : "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {donation.donorName || "Anonymous"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-medium text-slate-700">{donation.amount} XRP</span>
                                <span>•</span>
                                <span>{formatTimeAgo(donation.createdAt)}</span>
                              </div>
                            </div>
                            {donation.message && (
                              <p className="text-xs text-slate-600 leading-relaxed">{donation.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {donations.length > 3 && (
                  <div className="p-4 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-slate-600 hover:text-slate-800"
                      onClick={() => setShowAllDonations(!showAllDonations)}
                    >
                      {showAllDonations ? "Show less" : `See all ${donations.length} donations`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card className="bg-white border-slate-200">
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created{" "}
                      {campaign.createdAt instanceof Date && !isNaN(campaign.createdAt.getTime())
                        ? campaign.createdAt.toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Ends{" "}
                      {campaign.endDate instanceof Date && !isNaN(campaign.endDate.getTime())
                        ? campaign.endDate.toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{campaign.category} campaign</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Protection */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Donation protected</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Your donation is protected by XRPL blockchain security and WeFund's verification system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
