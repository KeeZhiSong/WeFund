"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { DonationTrackingService, type DonationTrackingResult } from "@/services/donation-tracking-service"
import type { Donation } from "@/types/database"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TrackDonationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [trackingResult, setTrackingResult] = useState<DonationTrackingResult | null>(null)
  const [userDonations, setUserDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadUserDonations()
    }
    loadSearchHistory()
  }, [user])

  const loadUserDonations = async () => {
    if (!user) return

    try {
      const donations = await DonationTrackingService.getUserDonations(user.uid)
      setUserDonations(donations.slice(0, 5)) // Show last 5 donations
    } catch (error) {
      console.error("Error loading user donations:", error)
    }
  }

  const loadSearchHistory = () => {
    const history = localStorage.getItem("donation-search-history")
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }

  const saveToSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, 5)
    setSearchHistory(newHistory)
    localStorage.setItem("donation-search-history", JSON.stringify(newHistory))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert(
        "Please enter a search term. Enter a transaction hash, donation ID, or wallet address to track your donation.",
      )
      return
    }

    setIsLoading(true)
    setTrackingResult(null)

    try {
      let result: DonationTrackingResult | null = null

      // Try tracking by transaction hash first
      if (searchQuery.length === 64) {
        result = await DonationTrackingService.trackByTransactionHash(searchQuery)
      } else {
        // Try tracking by donation ID
        result = await DonationTrackingService.trackByDonationId(searchQuery)
      }

      if (result) {
        setTrackingResult(result)
        saveToSearchHistory(searchQuery)
        alert("Donation found! Your donation has been successfully tracked.")
      } else {
        alert(
          "Donation not found. No donation found with the provided information. Please check your input and try again.",
        )
      }
    } catch (error) {
      console.error("Error tracking donation:", error)
      alert("Error tracking donation. An error occurred while tracking your donation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("The information has been copied to your clipboard.")
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        {/* Header with Home Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Track Your Donation</h1>
          <p className="text-gray-600 mt-2">Ensure transparency by tracking your donations on the blockchain</p>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">Search Donation</TabsTrigger>
            <TabsTrigger value="my-donations">My Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Track Donation
                </CardTitle>
                <CardDescription>
                  Enter your transaction hash, donation ID, or wallet address to track your donation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter transaction hash, donation ID, or wallet address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Track"}
                  </Button>
                </div>

                {searchHistory.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Searches:</p>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery(query)}
                          className="text-xs"
                        >
                          {query.length > 20 ? `${query.substring(0, 20)}...` : query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {trackingResult && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Donation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="font-medium">{trackingResult.donation.amount} XRP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(trackingResult.donation.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Campaign:</span>
                        <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                          {trackingResult.donation.campaign.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Donation ID:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{trackingResult.donation.id}</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(trackingResult.donation.id)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Blockchain Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(trackingResult.blockchainData.status)}
                      <Badge className={getStatusColor(trackingResult.blockchainData.status)}>
                        {trackingResult.blockchainData.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confirmations:</span>
                        <span className="font-medium">{trackingResult.blockchainData.confirmations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Block Number:</span>
                        <span className="font-medium">{trackingResult.blockchainData.blockNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Network Fee:</span>
                        <span className="font-medium">{trackingResult.blockchainData.fee} XRP</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm text-gray-600">Transaction Hash:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(trackingResult.blockchainData.transactionHash)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                        {trackingResult.blockchainData.transactionHash}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `https://livenet.xrpl.org/transactions/${trackingResult.blockchainData.transactionHash}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on XRPL Explorer
                    </Button>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Fund Allocation
                    </CardTitle>
                    <CardDescription>See how your donation is being allocated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Campaign Funds</span>
                          <span className="font-medium">{trackingResult.fundAllocation.campaignFunds} XRP</span>
                        </div>
                        <Progress
                          value={(trackingResult.fundAllocation.campaignFunds / trackingResult.donation.amount) * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Platform Fee (2.5%)</span>
                          <span className="font-medium">{trackingResult.fundAllocation.platformFee} XRP</span>
                        </div>
                        <Progress
                          value={(trackingResult.fundAllocation.platformFee / trackingResult.donation.amount) * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing Fee (1.5%)</span>
                          <span className="font-medium">{trackingResult.fundAllocation.processingFee} XRP</span>
                        </div>
                        <Progress
                          value={(trackingResult.fundAllocation.processingFee / trackingResult.donation.amount) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-donations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Recent Donations
                </CardTitle>
                <CardDescription>Click on any donation to track its status</CardDescription>
              </CardHeader>
              <CardContent>
                {userDonations.length > 0 ? (
                  <div className="space-y-3">
                    {userDonations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSearchQuery(donation.id)
                          handleSearch()
                        }}
                      >
                        <div>
                          <p className="font-medium">{donation.amount} XRP</p>
                          <p className="text-sm text-gray-600">{formatDate(donation.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Donation ID: {donation.id.substring(0, 8)}...</p>
                          <Badge variant="outline" className="text-xs">
                            Click to track
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No donations found</p>
                    <p className="text-sm text-gray-400 mt-1">Your donations will appear here once you make them</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
