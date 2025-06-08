"use client"

import type React from "react"

import { Calendar, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Campaign {
  id: number | string
  title: string
  description: string
  image: string
  raised: number
  goal: number
  donors: number
  daysLeft: number
  category: string
  walletAddress?: string
  endDate?: string | number | Date
}

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progressPercentage = (campaign.raised / campaign.goal) * 100

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (campaign.id) {
      // Navigate to the donation page with the campaign ID
      window.location.href = `/donate/${campaign.id}`
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Medical: "text-red-600 border-red-200",
      Community: "text-blue-600 border-blue-200",
      Business: "text-green-600 border-green-200",
      Education: "text-amber-600 border-amber-200",
    }
    const bgColors = {
      Medical: "#FEF2F2",
      Community: "#EFF6FF",
      Business: "#F0FDF4",
      Education: "#FFFBEB",
    }
    return {
      className: colors[category as keyof typeof colors] || "text-gray-600 border-gray-200",
      backgroundColor: bgColors[category as keyof typeof bgColors] || "#F9FAFB",
    }
  }

  const categoryStyle = getCategoryColor(campaign.category)

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block">
      <Card className="bg-white border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="relative">
          <Image
            src={campaign.image || "/placeholder.svg?height=200&width=400&query=campaign"}
            alt={campaign.title}
            width={400}
            height={200}
            className="w-full h-48 object-cover"
          />
          <Badge
            variant="secondary"
            className={`absolute top-3 left-3 ${categoryStyle.className}`}
            style={{ backgroundColor: categoryStyle.backgroundColor }}
          >
            {campaign.category}
          </Badge>
        </div>

        <CardHeader className="pb-3">
          <h3 className="font-semibold text-slate-800 text-lg leading-tight hover:text-teal-600 transition-colors">
            {campaign.title}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2">{campaign.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Raised</span>
              <span className="text-slate-800 font-medium">{(campaign.raised || 0).toLocaleString()} XRP</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Goal: {(campaign.goal || 0).toLocaleString()} XRP</span>
              <span className="font-medium" style={{ color: "#3CAEA3" }}>
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{campaign.donors || 0} donors</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {campaign.endDate
                  ? (() => {
                      const endDate = new Date(campaign.endDate)
                      const today = new Date()
                      const diffTime = endDate.getTime() - today.getTime()
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      return diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? "Ends today" : "Campaign ended"
                    })()
                  : `${campaign.daysLeft || 0} days left`}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: "#FF6F61" }}
            onClick={handleDonateClick}
          >
            Donate Now
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
