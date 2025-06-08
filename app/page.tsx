"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Globe,
  Pause,
  Play,
  Plus,
  Search,
  TrendingUp,
  Users,
  Wallet,
  Crown,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { CampaignCard } from "@/components/campaign-card"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"
import { DonorService } from "@/services/firebase-donors"
import type { Campaign, Donor } from "@/types/database"
import { EmailVerificationBanner } from "@/components/email-verification-banner"

export default function Dashboard() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [topDonors, setTopDonors] = useState<Donor[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [donorsLoading, setDonorsLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const campaignsPerPage = 3
  const totalSlides = Math.ceil(campaigns.length / campaignsPerPage)
  const autoScrollInterval = 4000 // 4 seconds

  // Handle authentication redirect
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth")
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return

      try {
        setCampaignsLoading(true)
        const fetchedCampaigns = await CampaignService.getCampaigns(12)
        setCampaigns(fetchedCampaigns)
      } catch (error) {
        console.error("Error fetching campaigns:", error)
        setCampaigns([])
      } finally {
        setCampaignsLoading(false)
      }
    }

    const fetchTopDonors = async () => {
      if (!user) return

      try {
        setDonorsLoading(true)
        const donors = await DonorService.getTopDonors(5)
        setTopDonors(donors)
      } catch (error) {
        console.error("Error fetching top donors:", error)
        setTopDonors([])
      } finally {
        setDonorsLoading(false)
      }
    }

    if (user) {
      fetchCampaigns()
      fetchTopDonors()
    }
  }, [user])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling)
    setIsPaused(!isPaused)
  }

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || isPaused) return

    const interval = setInterval(() => {
      nextSlide()
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [isAutoScrolling, isPaused, nextSlide, autoScrollInterval])

  // Pause auto-scroll on hover
  const handleMouseEnter = () => {
    if (isAutoScrolling) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (isAutoScrolling) {
      setIsPaused(false)
    }
  }

  const visibleCampaigns = campaigns.slice(currentSlide * campaignsPerPage, (currentSlide + 1) * campaignsPerPage)

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard content if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="/images/Untitled_design-removebg-preview.png" alt="WeFund Logo" className="h-24 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative ml-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input
                placeholder="Search campaigns, donors and more..."
                className="pl-10 w-80 bg-white border-slate-300 text-slate-800 placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            <Button size="icon" variant="ghost" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-teal-100 text-teal-700">
                  {user.displayName?.charAt(0) || user.email.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-800">{user.displayName || "User"}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  if (confirm("Are you sure you want to sign out?")) {
                    signOut()
                    router.push("/auth")
                  }
                }}
              >
                Sign Out
              </Button>

              <Link href="/campaigns/create">
                <Button className="bg-coral-500 hover:bg-coral-600 text-white" style={{ backgroundColor: "#FF6F61" }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Donations</CardTitle>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#3CAEA3" }}>
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">1,284,702 XRP</div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-teal-600 font-medium">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Donations Today</CardTitle>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#FFC947" }}>
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">8,755 XRP</div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-teal-600 font-medium">+5.2%</span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Donors</CardTitle>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#FF6F61" }}>
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">3,544</div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-teal-600 font-medium">+8.1%</span> new donors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Donation</CardTitle>
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#3CAEA3" }}>
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">484.70 XRP</div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="text-teal-600 font-medium">+2.3%</span> increase
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Donors Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Top Donors</h2>
            <Link href="/donors">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-800">
                View All
              </Button>
            </Link>
          </div>

          {donorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-slate-600">Loading top donors...</span>
            </div>
          ) : topDonors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topDonors.map((donor, index) => (
                <Card key={donor.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-12 w-12 mx-auto">
                        <AvatarImage src={donor.profileImage || "/placeholder.svg?height=48&width=48"} />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {donor.displayName?.charAt(0) || donor.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />}
                    </div>
                    <h3 className="font-medium text-slate-800 text-sm mb-1 truncate">
                      {donor.displayName || "Anonymous"}
                    </h3>
                    <p className="text-xs text-slate-600 mb-2">{donor.totalDonated?.toLocaleString() || 0} XRP</p>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: "#3CAEA3", color: "white" }}
                    >
                      {donor.donationsCount || 0} donations
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-slate-100 mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No Donors Yet</h3>
                  <p className="text-slate-600 mb-4">Be the first to make a donation and support a campaign!</p>
                  <Link href="/campaigns">
                    <Button style={{ backgroundColor: "#FF6F61" }}>Browse Campaigns</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Campaigns Section with Dynamic Scrolling */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Active Campaigns</h2>
            <div className="flex items-center gap-3">
              {/* Auto-scroll toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoScroll}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-2"
              >
                {isAutoScrolling ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="text-sm">Auto</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Manual</span>
                  </>
                )}
              </Button>

              {/* Slide indicators */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "w-6" : "w-2 hover:bg-slate-400"
                    }`}
                    style={{
                      backgroundColor: index === currentSlide ? "#3CAEA3" : "#CBD5E1",
                    }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSlide}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Campaigns container with smooth transitions */}
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-slate-600">Loading campaigns...</span>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="relative overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                  width: `${totalSlides * 100}%`,
                }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div
                    key={slideIndex}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full flex-shrink-0"
                  >
                    {campaigns
                      .slice(slideIndex * campaignsPerPage, (slideIndex + 1) * campaignsPerPage)
                      .map((campaign) => (
                        <div key={campaign.id} className="transform transition-all duration-300 hover:scale-105">
                          <CampaignCard campaign={campaign} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>

              {/* Progress bar for auto-scroll */}
              {isAutoScrolling && !isPaused && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                  <div
                    className="h-full transition-all duration-100 ease-linear"
                    style={{
                      backgroundColor: "#3CAEA3",
                      animation: `progress ${autoScrollInterval}ms linear infinite`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No campaigns available at the moment.</p>
              <Link href="/campaigns/create">
                <Button className="mt-4" style={{ backgroundColor: "#FF6F61" }}>
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* XRPL Features Banner */}
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Powered by XRP Ledger</h3>
                <p className="text-slate-600 mb-4">
                  Experience instant, low-cost, and transparent donations with blockchain technology
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: "#3CAEA3" }} />
                    <span>Global Reach</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: "#FFC947" }} />
                    <span>3-5 Second Settlement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#FF6F61" }} />
                    <span>~$0.0002 Transaction Fee</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant="secondary"
                  className="text-teal-700 border-teal-300"
                  style={{ backgroundColor: "#3CAEA3", color: "white" }}
                >
                  Live on Mainnet
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
