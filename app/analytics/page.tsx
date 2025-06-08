"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AnalyticsService } from "@/services/firebase-analytics"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

// Mock data for when Firebase is not available or user doesn't have permissions
const mockPlatformOverview = {
  totalDonations: 1247,
  totalAmount: 125000,
  totalCampaigns: 89,
  totalUsers: 456,
  successRate: 67.4,
  avgDonation: 100.24,
}

const mockDonationStats = {
  totalDonations: 1247,
  totalAmount: 125000,
  avgDonation: 100.24,
  donationTrend: [
    { date: "2024-01-01", amount: 2500, count: 25 },
    { date: "2024-01-02", amount: 3200, count: 32 },
    { date: "2024-01-03", amount: 2800, count: 28 },
    { date: "2024-01-04", amount: 4100, count: 41 },
    { date: "2024-01-05", amount: 3600, count: 36 },
    { date: "2024-01-06", amount: 2900, count: 29 },
    { date: "2024-01-07", amount: 3800, count: 38 },
  ],
}

const mockCampaignStats = {
  totalCampaigns: 89,
  activeCampaigns: 34,
  completedCampaigns: 55,
  successRate: 67.4,
  avgGoal: 5000,
  avgRaised: 3370,
  fundingRate: 67.4,
  categoryDistribution: [
    { category: "Education", count: 25, totalRaised: 45000 },
    { category: "Healthcare", count: 20, totalRaised: 38000 },
    { category: "Environment", count: 18, totalRaised: 22000 },
    { category: "Community", count: 15, totalRaised: 15000 },
    { category: "Technology", count: 11, totalRaised: 5000 },
  ],
}

const mockUserStats = {
  totalUsers: 456,
  donors: 298,
  campaigners: 145,
  admins: 13,
  verificationRate: 78.5,
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [period, setPeriod] = useState<"week" | "month" | "year" | "all">("month")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const [platformOverview, setPlatformOverview] = useState<any>(null)
  const [donationStats, setDonationStats] = useState<any>(null)
  const [campaignStats, setCampaignStats] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      setUsingMockData(false)

      try {
        // Check if user is authenticated
        if (!user) {
          throw new Error("Authentication required to view analytics")
        }

        // Try to use the AnalyticsService to fetch data directly from Firebase
        const [overview, donations, campaigns, users] = await Promise.all([
          AnalyticsService.getPlatformOverview(),
          AnalyticsService.getDonationStats(period),
          AnalyticsService.getCampaignStats(period),
          AnalyticsService.getUserStats(period),
        ])

        setPlatformOverview(overview)
        setDonationStats(donations)
        setCampaignStats(campaigns)
        setUserStats(users)
      } catch (err) {
        console.error("Failed to fetch analytics from Firebase:", err)

        // Use mock data when Firebase fails or user doesn't have permissions
        console.log("Using mock data for analytics")
        setUsingMockData(true)
        setPlatformOverview(mockPlatformOverview)
        setDonationStats(mockDonationStats)
        setCampaignStats(mockCampaignStats)
        setUserStats(mockUserStats)

        // Show a warning but don't treat it as a fatal error
        if (err instanceof Error && err.message.includes("permissions")) {
          setError("Using demo data - Firebase permissions not configured")
        } else if (!user) {
          setError("Please sign in to view real analytics data")
        } else {
          setError("Using demo data - Firebase connection issue")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period, user])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const renderPeriodSelector = () => (
    <div className="flex justify-end mb-6">
      <div className="inline-flex rounded-md shadow-sm">
        <button
          onClick={() => setPeriod("week")}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            period === "week" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`px-4 py-2 text-sm font-medium ${
            period === "month" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`px-4 py-2 text-sm font-medium ${
            period === "year" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Year
        </button>
        <button
          onClick={() => setPeriod("all")}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            period === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          All Time
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">Loading analytics data...</p>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              {usingMockData && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Demo Data
                  </Badge>
                  <span className="text-sm text-gray-500">{error || "Showing sample analytics data"}</span>
                </div>
              )}
            </div>
            {renderPeriodSelector()}
          </div>

          {/* Platform Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformOverview?.totalDonations || 0}</div>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(platformOverview?.totalAmount || 0)} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformOverview?.totalCampaigns || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {campaignStats?.successRate?.toFixed(1) || 0}% success rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformOverview?.totalUsers || 0}</div>
                <p className="text-xs text-gray-500 mt-1">{userStats?.verificationRate?.toFixed(1) || 0}% verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Donation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(platformOverview?.avgDonation || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Per donation</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="donations" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="donations">Donations</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            {/* Donations Tab */}
            <TabsContent value="donations">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Donation Trends</CardTitle>
                    <CardDescription>Daily donation amounts over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={donationStats?.donationTrend || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Donation Amount" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Donation Statistics</CardTitle>
                    <CardDescription>Key metrics for donations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Total Donations</span>
                          <span className="text-sm font-medium">{donationStats?.totalDonations || 0}</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Total Amount</span>
                          <span className="text-sm font-medium">{formatCurrency(donationStats?.totalAmount || 0)}</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Donation</span>
                          <span className="text-sm font-medium">{formatCurrency(donationStats?.avgDonation || 0)}</span>
                        </div>
                        <Progress
                          value={
                            donationStats?.avgDonation && donationStats?.totalAmount
                              ? (donationStats.avgDonation / donationStats.totalAmount) * 100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Campaign Categories</CardTitle>
                    <CardDescription>Distribution of campaigns by category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={campaignStats?.categoryDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="category"
                          label={({ category, count }) => `${category}: ${count}`}
                        >
                          {campaignStats?.categoryDistribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Campaigns"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Statistics</CardTitle>
                    <CardDescription>Key metrics for campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Total Campaigns</span>
                          <span className="text-sm font-medium">{campaignStats?.totalCampaigns || 0}</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-50">
                            Active: {campaignStats?.activeCampaigns || 0}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50">
                            Completed: {campaignStats?.completedCampaigns || 0}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Success Rate</span>
                          <span className="text-sm font-medium">{campaignStats?.successRate?.toFixed(1) || 0}%</span>
                        </div>
                        <Progress value={campaignStats?.successRate || 0} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Funding Rate</span>
                          <span className="text-sm font-medium">{campaignStats?.fundingRate?.toFixed(1) || 0}%</span>
                        </div>
                        <Progress value={campaignStats?.fundingRate || 0} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Goal</span>
                          <span className="text-sm font-medium">{formatCurrency(campaignStats?.avgGoal || 0)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Raised</span>
                          <span className="text-sm font-medium">{formatCurrency(campaignStats?.avgRaised || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Distribution of users by role</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Donors", value: userStats?.donors || 0 },
                          { name: "Campaigners", value: userStats?.campaigners || 0 },
                          { name: "Admins", value: userStats?.admins || 0 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Users" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                    <CardDescription>Key metrics for users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Total Users</span>
                          <span className="text-sm font-medium">{userStats?.totalUsers || 0}</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Donors</span>
                          <span className="text-sm font-medium">{userStats?.donors || 0}</span>
                        </div>
                        <Progress
                          value={userStats?.totalUsers ? (userStats.donors / userStats.totalUsers) * 100 : 0}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Campaigners</span>
                          <span className="text-sm font-medium">{userStats?.campaigners || 0}</span>
                        </div>
                        <Progress
                          value={userStats?.totalUsers ? (userStats.campaigners / userStats.totalUsers) * 100 : 0}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Admins</span>
                          <span className="text-sm font-medium">{userStats?.admins || 0}</span>
                        </div>
                        <Progress
                          value={userStats?.totalUsers ? (userStats.admins / userStats.totalUsers) * 100 : 0}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Verification Rate</span>
                          <span className="text-sm font-medium">{userStats?.verificationRate?.toFixed(1) || 0}%</span>
                        </div>
                        <Progress value={userStats?.verificationRate || 0} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
