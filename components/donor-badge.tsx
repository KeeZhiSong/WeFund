import type React from "react"
import { Award, Heart, Star, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DonorBadgeProps {
  type: string
  size?: "sm" | "md" | "lg"
}

export function DonorBadge({ type, size = "md" }: DonorBadgeProps) {
  const badgeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
    platinum: {
      label: "Platinum",
      icon: <Award className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      description: "Donated over 10,000 XRP",
    },
    gold: {
      label: "Gold",
      icon: <Award className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-amber-100 text-amber-800 border-amber-200",
      description: "Donated over 5,000 XRP",
    },
    silver: {
      label: "Silver",
      icon: <Award className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-slate-100 text-slate-800 border-slate-200",
      description: "Donated over 1,000 XRP",
    },
    bronze: {
      label: "Bronze",
      icon: <Award className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-orange-100 text-orange-800 border-orange-200",
      description: "Donated over 100 XRP",
    },
    frequent: {
      label: "Frequent",
      icon: <Zap className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Made over 50 donations",
    },
    creator: {
      label: "Creator",
      icon: <Star className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Has created campaigns",
    },
    supporter: {
      label: "Supporter",
      icon: <Heart className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} />,
      color: "bg-red-100 text-red-800 border-red-200",
      description: "Regular supporter",
    },
  }

  const config = badgeConfig[type] || {
    label: type,
    icon: null,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Donor badge",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${config.color} flex items-center gap-1 ${
              size === "sm" ? "text-xs py-0 px-1.5" : size === "lg" ? "text-sm py-1 px-3" : "text-xs py-0.5 px-2"
            }`}
          >
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
