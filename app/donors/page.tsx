"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DonorService, type DonorStats } from "@/services/firebase-donors"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, TrendingUp, Award, Calendar } from "lucide-react"

const DonorsPage = () => {
  const [donors, setDonors] = useState<DonorStats[]>([])
  const [filteredDonors, setFilteredDonors] = useState<DonorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setLoading(true)
        const donorData = await DonorService.getTopDonors(100)
        setDonors(donorData)
        setFilteredDonors(donorData)
      } catch (e: any) {
        setError(e.message)
        console.error("Failed to fetch donors:", e)
        alert(`Failed to fetch donors: ${e.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDonors()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = donors.filter(
        (donor) =>
          donor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donor.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredDonors(filtered)
    } else {
      setFilteredDonors(donors)
    }
  }, [searchTerm, donors])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "platinum":
        return "bg-purple-100 text-purple-800"
      case "gold":
        return "bg-yellow-100 text-yellow-800"
      case "silver":
        return "bg-gray-100 text-gray-800"
      case "bronze":
        return "bg-orange-100 text-orange-800"
      case "frequent":
        return "bg-blue-100 text-blue-800"
      case "creator":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalDonations = donors.reduce((sum, donor) => sum + donor.totalDonated, 0)
  const totalDonors = donors.length
  const averageDonation = totalDonors > 0 ? totalDonations / totalDonors : 0

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Donors</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Donors</h1>
            <p className="text-gray-600">Manage and view donor information and statistics</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDonors}</div>
                <p className="text-xs text-muted-foreground">Active contributors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDonations.toFixed(3)} XRP</div>
                <p className="text-xs text-muted-foreground">Lifetime contributions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageDonation.toFixed(3)} XRP</div>
                <p className="text-xs text-muted-foreground">Per donor</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search donors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Donors List */}
          {filteredDonors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No donors found" : "No donors yet"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "Donors will appear here once they start contributing to campaigns."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDonors.map((donor) => (
                <Card key={donor.uid} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={donor.profileImage || "/placeholder.svg"} alt={donor.displayName} />
                          <AvatarFallback>
                            {donor.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{donor.displayName}</h3>
                            {donor.badges &&
                              donor.badges.map((badge) => (
                                <Badge key={badge} className={getBadgeColor(badge)}>
                                  {badge}
                                </Badge>
                              ))}
                          </div>

                          <p className="text-gray-600 mb-2">{donor.email}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Total Donated:</span>
                              <p className="font-semibold text-green-600">{formatCurrency(donor.totalDonated)}</p>
                            </div>

                            <div>
                              <span className="text-gray-500">Donations:</span>
                              <p className="font-semibold">{donor.donationsCount}</p>
                            </div>

                            <div>
                              <span className="text-gray-500">Average:</span>
                              <p className="font-semibold">
                                {donor.averageDonation ? formatCurrency(donor.averageDonation) : "N/A"}
                              </p>
                            </div>

                            <div>
                              <span className="text-gray-500">Last Donation:</span>
                              <p className="font-semibold flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(donor.lastDonationDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DonorsPage
