"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CampaignCard } from "@/components/campaign-card"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"
import type { Campaign } from "@/types/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        const fetchedCampaigns = await CampaignService.getCampaigns(50)
        setCampaigns(fetchedCampaigns)
      } catch (error) {
        console.error("Could not fetch campaigns:", error)
        alert("Failed to fetch campaigns. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const handleCreateCampaign = () => {
    if (!user) {
      alert("Please sign in to create a campaign.")
      router.push("/auth")
      return
    }
    router.push("/campaigns/create")
  }

  const handleEditCampaign = (id: string) => {
    router.push(`/campaigns/${id}/edit`)
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return
    }

    try {
      await CampaignService.deleteCampaign(id)
      setCampaigns(campaigns.filter((campaign) => campaign.id !== id))
      alert("Campaign deleted successfully!")
    } catch (error) {
      console.error("Could not delete campaign:", error)
      alert("Failed to delete campaign. Please try again.")
    }
  }

  // Filter campaigns based on search term and status
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading campaigns...</p>
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
              <p className="text-slate-600 mt-2">Discover and support meaningful causes</p>
            </div>
            <Button onClick={handleCreateCampaign} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-800">{campaigns.length}</div>
                <p className="text-sm text-slate-600">Total Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-800">
                  {campaigns.filter((c) => c.status === "active").length}
                </div>
                <p className="text-sm text-slate-600">Active Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-800">
                  {campaigns.reduce((sum, c) => sum + (c.raised || 0), 0).toLocaleString()} XRP
                </div>
                <p className="text-sm text-slate-600">Total Raised</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Grid/List */}
          {filteredCampaigns.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="group">
                  {viewMode === "grid" ? (
                    <CampaignCard campaign={campaign} />
                  ) : (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800">{campaign.title}</h3>
                              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-4 line-clamp-2">{campaign.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Goal: {campaign.goal.toLocaleString()} XRP</span>
                              <span>Raised: {(campaign.raised || 0).toLocaleString()} XRP</span>
                              <span>Donors: {campaign.donors || 0}</span>
                            </div>
                          </div>
                          {user && user.uid === campaign.creatorId && (
                            <div className="flex gap-2 ml-4">
                              <Button variant="outline" size="sm" onClick={() => handleEditCampaign(campaign.id)}>
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-slate-400 mb-4">
                  <Filter className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No campaigns found</h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Be the first to create a campaign!"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={handleCreateCampaign} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
