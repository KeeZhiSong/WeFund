import { db } from "@/lib/firebase"
import { collection, query, getDocs, where, orderBy, Timestamp } from "firebase/firestore"
import type { Campaign, Donation, User } from "@/types/database"

// Mock data for when Firebase is not available or collections don't exist
const mockDonationTrend = [
  { date: "2024-01-01", amount: 2500, count: 25 },
  { date: "2024-01-02", amount: 3200, count: 32 },
  { date: "2024-01-03", amount: 2800, count: 28 },
  { date: "2024-01-04", amount: 4100, count: 41 },
  { date: "2024-01-05", amount: 3600, count: 36 },
  { date: "2024-01-06", amount: 2900, count: 29 },
  { date: "2024-01-07", amount: 3800, count: 38 },
]

const mockCategoryDistribution = [
  { category: "Education", count: 25, totalRaised: 45000 },
  { category: "Healthcare", count: 20, totalRaised: 38000 },
  { category: "Environment", count: 18, totalRaised: 22000 },
  { category: "Community", count: 15, totalRaised: 15000 },
  { category: "Technology", count: 11, totalRaised: 5000 },
]

export class AnalyticsService {
  // Helper method to check if Firebase is available and collections exist
  private static async checkFirebaseAvailability(): Promise<boolean> {
    try {
      if (!db) {
        console.log("Firebase not initialized")
        return false
      }

      // Try a simple query to test permissions - use donations collection instead of users
      const testRef = collection(db, "donations")
      const testQuery = query(testRef, orderBy("createdAt", "desc"))
      await getDocs(testQuery)
      return true
    } catch (error) {
      console.log("Firebase not available or no permissions:", error)
      return false
    }
  }

  // Get donation statistics
  static async getDonationStats(period: "today" | "week" | "month" | "year" | "all" = "all") {
    try {
      const isAvailable = await this.checkFirebaseAvailability()

      if (!isAvailable) {
        // Return mock data when Firebase is not available
        return {
          totalDonations: 0, // Changed from 1247 to 0 to make it clear when using mock data
          totalAmount: 0,
          avgDonation: 0,
          donationTrend: [],
        }
      }

      const donationsRef = collection(db, "donations")
      let q = query(donationsRef, orderBy("createdAt", "desc"))

      if (period !== "all") {
        const date = new Date()
        if (period === "today") {
          // Set to start of today
          date.setHours(0, 0, 0, 0)
        } else if (period === "week") {
          date.setDate(date.getDate() - 7)
        } else if (period === "month") {
          date.setMonth(date.getMonth() - 1)
        } else if (period === "year") {
          date.setFullYear(date.getFullYear() - 1)
        }
        q = query(donationsRef, where("createdAt", ">=", Timestamp.fromDate(date)), orderBy("createdAt", "desc"))
      }

      const snapshot = await getDocs(q)
      const donations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Donation[]

      // Calculate total amount
      const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)

      // Calculate average donation
      const avgDonation = donations.length > 0 ? totalAmount / donations.length : 0

      // Group donations by day for chart
      const donationsByDay = donations.reduce(
        (acc, donation) => {
          const date = new Date((donation.createdAt as any).toDate())
          const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

          if (!acc[day]) {
            acc[day] = {
              date: day,
              amount: 0,
              count: 0,
            }
          }

          acc[day].amount += donation.amount
          acc[day].count += 1

          return acc
        },
        {} as Record<string, { date: string; amount: number; count: number }>,
      )

      // Convert to array and sort by date
      const donationTrend = Object.values(donationsByDay).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      // Add logging before the return statement
      console.log("Donations fetched:", donations.length, "donations")
      console.log("Sample donations:", donations.slice(0, 3))

      return {
        totalDonations: donations.length,
        totalAmount,
        avgDonation,
        donationTrend,
      }
    } catch (error) {
      console.error("Error fetching donation stats, using mock data:", error)
      // Return mock data on error
      return {
        totalDonations: 0, // Changed from 1247 to 0 to make it clear when using mock data
        totalAmount: 0,
        avgDonation: 0,
        donationTrend: [],
      }
    }
  }

  // Get campaign statistics
  static async getCampaignStats(period: "week" | "month" | "year" | "all" = "all") {
    try {
      const isAvailable = await this.checkFirebaseAvailability()

      if (!isAvailable) {
        // Return mock data when Firebase is not available
        return {
          totalCampaigns: 89,
          activeCampaigns: 34,
          completedCampaigns: 55,
          successRate: 67.4,
          avgGoal: 5000,
          avgRaised: 3370,
          fundingRate: 67.4,
          categoryDistribution: mockCategoryDistribution,
        }
      }

      const campaignsRef = collection(db, "campaigns")
      let q = query(campaignsRef)

      if (period !== "all") {
        const date = new Date()
        if (period === "week") {
          date.setDate(date.getDate() - 7)
        } else if (period === "month") {
          date.setMonth(date.getMonth() - 1)
        } else if (period === "year") {
          date.setFullYear(date.getFullYear() - 1)
        }
        q = query(campaignsRef, where("createdAt", ">=", Timestamp.fromDate(date)))
      }

      const snapshot = await getDocs(q)
      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[]

      // Calculate success rate (campaigns that reached their goal)
      const successfulCampaigns = campaigns.filter((campaign) => campaign.raised >= campaign.goal)
      const successRate = campaigns.length > 0 ? (successfulCampaigns.length / campaigns.length) * 100 : 0

      // Calculate average goal and raised amounts
      const totalGoal = campaigns.reduce((sum, campaign) => sum + campaign.goal, 0)
      const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raised, 0)
      const avgGoal = campaigns.length > 0 ? totalGoal / campaigns.length : 0
      const avgRaised = campaigns.length > 0 ? totalRaised / campaigns.length : 0

      // Group campaigns by category
      const campaignsByCategory = campaigns.reduce(
        (acc, campaign) => {
          if (!acc[campaign.category]) {
            acc[campaign.category] = {
              category: campaign.category,
              count: 0,
              totalRaised: 0,
            }
          }

          acc[campaign.category].count += 1
          acc[campaign.category].totalRaised += campaign.raised

          return acc
        },
        {} as Record<string, { category: string; count: number; totalRaised: number }>,
      )

      // Convert to array
      const categoryDistribution = Object.values(campaignsByCategory)

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((campaign) => campaign.status === "active").length,
        completedCampaigns: campaigns.filter((campaign) => campaign.status === "completed").length,
        successRate,
        avgGoal,
        avgRaised,
        fundingRate: totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0,
        categoryDistribution,
      }
    } catch (error) {
      console.error("Error fetching campaign stats, using mock data:", error)
      // Return mock data on error
      return {
        totalCampaigns: 89,
        activeCampaigns: 34,
        completedCampaigns: 55,
        successRate: 67.4,
        avgGoal: 5000,
        avgRaised: 3370,
        fundingRate: 67.4,
        categoryDistribution: mockCategoryDistribution,
      }
    }
  }

  // Get user statistics
  static async getUserStats(period: "week" | "month" | "year" | "all" = "all") {
    try {
      if (!db) {
        console.log("Firebase not initialized")
        return {
          totalUsers: 0,
          donors: 0,
          campaigners: 0,
          admins: 0,
          verificationRate: 0,
        }
      }

      const usersRef = collection(db, "users")
      let q = query(usersRef)

      if (period !== "all") {
        const date = new Date()
        if (period === "week") {
          date.setDate(date.getDate() - 7)
        } else if (period === "month") {
          date.setMonth(date.getMonth() - 1)
        } else if (period === "year") {
          date.setFullYear(date.getFullYear() - 1)
        }
        q = query(usersRef, where("createdAt", ">=", Timestamp.fromDate(date)))
      }

      const snapshot = await getDocs(q)
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]

      // Count users by role
      const usersByRole = users.reduce(
        (acc, user) => {
          if (!acc[user.role]) {
            acc[user.role] = 0
          }

          acc[user.role] += 1

          return acc
        },
        {} as Record<string, number>,
      )

      // Calculate verification rate
      const verifiedUsers = users.filter((user) => user.isVerified)
      const verificationRate = users.length > 0 ? (verifiedUsers.length / users.length) * 100 : 0

      return {
        totalUsers: users.length,
        donors: usersByRole["donor"] || 0,
        campaigners: usersByRole["campaigner"] || 0,
        admins: usersByRole["admin"] || 0,
        verificationRate,
      }
    } catch (error) {
      console.error("Error fetching user stats, using fallback data:", error)

      // Check if it's a permissions error
      if (error.message && error.message.includes("permissions")) {
        console.log("Insufficient permissions for users collection, returning empty stats")
      }

      // Return empty stats instead of mock data when there are permission issues
      return {
        totalUsers: 0,
        donors: 0,
        campaigners: 0,
        admins: 0,
        verificationRate: 0,
      }
    }
  }

  // Get platform overview
  static async getPlatformOverview() {
    try {
      const [donationStats, campaignStats, userStats] = await Promise.all([
        this.getDonationStats("all"),
        this.getCampaignStats("all"),
        this.getUserStats("all"),
      ])

      return {
        totalDonations: donationStats.totalDonations,
        totalAmount: donationStats.totalAmount,
        totalCampaigns: campaignStats.totalCampaigns,
        totalUsers: userStats.totalUsers,
        successRate: campaignStats.successRate,
        avgDonation: donationStats.avgDonation,
      }
    } catch (error) {
      console.error("Error fetching platform overview:", error)

      // Try to get individual stats that might work
      try {
        const donationStats = await this.getDonationStats("all")
        const campaignStats = await this.getCampaignStats("all")

        return {
          totalDonations: donationStats.totalDonations,
          totalAmount: donationStats.totalAmount,
          totalCampaigns: campaignStats.totalCampaigns,
          totalUsers: 0, // Set to 0 if users collection is not accessible
          successRate: campaignStats.successRate,
          avgDonation: donationStats.avgDonation,
        }
      } catch (fallbackError) {
        console.error("Fallback also failed, using minimal mock data:", fallbackError)
        return {
          totalDonations: 0,
          totalAmount: 0,
          totalCampaigns: 0,
          totalUsers: 0,
          successRate: 0,
          avgDonation: 0,
        }
      }
    }
  }
}
