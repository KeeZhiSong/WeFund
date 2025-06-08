"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Globe,
  LogOut,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { CampaignCard } from "@/components/campaign-card"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"
import type { Campaign } from "@/types/database"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnalyticsService } from "@/services/firebase-analytics"

export default function Dashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [donationStats, setDonationStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    avgDonation: 0,
    donationTrend: [],
  })
  const [todayDonations, setTodayDonations] = useState({
    totalAmount: 0,
    count: 0,
  })
  const campaignsPerView = 3
  const maxIndex = Math.max(0, campaigns.length - campaignsPerView)
  const autoScrollInterval = 4000 // 4 seconds

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        const fetchedCampaigns = await CampaignService.getCampaigns(12)
        setCampaigns(fetchedCampaigns)
      } catch (error) {
        console.error("Error fetching campaigns:", error)
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  useEffect(() => {
    const fetchDonationStats = async () => {
      try {
        const stats = await AnalyticsService.getDonationStats()
        setDonationStats(stats)
      } catch (error) {
        console.error("Error fetching donation stats:", error)
      }
    }

    fetchDonationStats()
  }, [])

  useEffect(() => {
    const fetchTodayDonations = async () => {
      try {
        // Get today's start date (midnight)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const stats = await AnalyticsService.getDonationStats("today")
        setTodayDonations(stats)
      } catch (error) {
        console.error("Error fetching today's donations:", error)
      }
    }

    fetchTodayDonations()
  }, [])

  useEffect(() => {
    console.log("Donation stats updated:", donationStats)
  }, [donationStats])

  const nextCampaigns = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }, [maxIndex])

  const prevCampaigns = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling)
    setIsPaused(!isPaused)
  }

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoScrolling || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex) {
          return 0 // Reset to beginning
        }
        return prev + 1
      })
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [isAutoScrolling, isPaused, maxIndex, autoScrollInterval])

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

  const visibleCampaigns = campaigns.slice(currentIndex, currentIndex + campaignsPerView)

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
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

      {/* Content overlay */}
      <div className="relative z-10 flex w-full">
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

              {/* Conditional rendering based on authentication status */}
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-2 transition-colors">
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount style={{ zIndex: 9999 }}>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Are you sure you want to sign out?")) {
                            signOut()
                            router.push("/auth")
                          }
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-3">
                    <Link href="/campaigns/create">
                      <Button
                        className="bg-coral-500 hover:bg-coral-600 text-white"
                        style={{ backgroundColor: "#FF6F61" }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Campaign
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth">
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="text-white" style={{ backgroundColor: "#FF6F61" }}>
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

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
                <div className="text-2xl font-bold text-slate-800">
                  {donationStats.totalAmount.toLocaleString()} XRP
                </div>
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
                <div className="text-2xl font-bold text-slate-800">
                  {todayDonations.totalAmount.toLocaleString()} XRP
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Donations</CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#FF6F61" }}>
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {donationStats.totalDonations.toLocaleString() || 0}
                </div>
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
                <div className="text-2xl font-bold text-slate-800">{donationStats.avgDonation.toFixed(2)} XRP</div>
              </CardContent>
            </Card>
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

                {/* Campaign indicators */}
                <div className="flex items-center gap-1">
                  {campaigns.length > campaignsPerView &&
                    Array.from({ length: maxIndex + 1 }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex ? "w-6" : "w-2 hover:bg-slate-400"
                        }`}
                        style={{
                          backgroundColor: index === currentIndex ? "#3CAEA3" : "#CBD5E1",
                        }}
                      />
                    ))}
                </div>

                {/* Navigation buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevCampaigns}
                  disabled={currentIndex === 0}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextCampaigns}
                  disabled={currentIndex >= maxIndex}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / campaignsPerView)}%)`,
                  width: `${Math.ceil(campaigns.length / campaignsPerView) * 100}%`,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {campaigns.slice(currentIndex, currentIndex + campaignsPerView).map((campaign) => (
                    <div key={campaign.id} className="transform transition-all duration-300 hover:scale-105">
                      <CampaignCard campaign={campaign} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar for auto-scroll */}
              {isAutoScrolling && !isPaused && campaigns.length > campaignsPerView && (
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
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
