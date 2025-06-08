import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Campaign, Donation } from "@/types/database"
import { safeToDate } from "@/lib/date-utils"

// Mock campaign data for fallback
const mockCampaigns: Campaign[] = [
  {
    id: "mock-campaign-1",
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
  },
  {
    id: "mock-campaign-2",
    title: "Community Garden Project",
    description: "Help us build a community garden in the heart of the city.",
    goal: 5000,
    raised: 2200,
    donors: 28,
    daysLeft: 20,
    image: "/placeholder.svg?height=400&width=600",
    category: "Community",
    status: "active",
    creatorId: "mock-user",
    walletAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    createdAt: new Date(),
    updatedAt: new Date(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
]

// Helper function to store pending donations in localStorage
const storePendingDonation = (donation: any) => {
  try {
    const pendingDonations = JSON.parse(localStorage.getItem("pendingDonations") || "[]")
    pendingDonations.push({
      ...donation,
      timestamp: new Date().toISOString(),
      status: "pending",
    })
    localStorage.setItem("pendingDonations", JSON.stringify(pendingDonations))
    console.log("Donation stored in localStorage for later processing")
    return true
  } catch (error) {
    console.error("Failed to store in localStorage:", error)
    return false
  }
}

export class CampaignService {
  static async createCampaign(campaignData: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      if (typeof window === "undefined") {
        throw new Error("Cannot access Firestore on server side")
      }

      // Filter out undefined values to prevent Firestore errors
      const cleanedData = Object.fromEntries(Object.entries(campaignData).filter(([_, value]) => value !== undefined))

      const docRef = await addDoc(collection(db, "campaigns"), {
        ...cleanedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Create campaign error:", error)
      // Return a mock ID for fallback
      return `mock-${Math.random().toString(36).substring(2, 15)}`
    }
  }

  static async getCampaigns(limitCount = 10): Promise<Campaign[]> {
    try {
      if (typeof window === "undefined") {
        return mockCampaigns
      }

      // Simplified query - just get recent campaigns without filtering by status
      // This avoids the need for a composite index
      const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(limitCount))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return mockCampaigns
      }

      const allCampaigns = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          endDate: safeToDate(data.endDate),
        } as Campaign
      })

      return allCampaigns.filter((campaign) => campaign.status === "active")
    } catch (error) {
      console.error("Get campaigns error:", error)
      return mockCampaigns
    }
  }

  static async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      if (typeof window === "undefined") {
        return mockCampaigns[0]
      }

      const docRef = doc(db, "campaigns", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return mockCampaigns[0]
      }

      const data = docSnap.data()

      // Convert timestamps using utility function
      const campaign: Campaign = {
        id: docSnap.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
        endDate: safeToDate(data.endDate),
      } as Campaign

      return campaign
    } catch (error) {
      console.error("Get campaign error:", error)
      return mockCampaigns[0]
    }
  }

  static async updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
    try {
      if (typeof window === "undefined") {
        throw new Error("Cannot access Firestore on server side")
      }

      console.log("Attempting to update campaign:", id, updates)

      await updateDoc(doc(db, "campaigns", id), {
        ...updates,
        updatedAt: new Date(),
      })

      console.log("Campaign updated successfully")
    } catch (error: any) {
      console.error("Update campaign error details:", {
        error: error.message,
        code: error.code,
        campaignId: id,
      })

      if (error.code === "permission-denied") {
        throw new Error(
          "You don't have permission to update this campaign. Please check if you're the campaign owner and logged in.",
        )
      } else if (error.code === "not-found") {
        throw new Error("Campaign not found.")
      } else if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(
          "Insufficient permissions to update this campaign. Please ensure you're logged in and own this campaign.",
        )
      } else {
        throw new Error(`Failed to update campaign: ${error.message}`)
      }
    }
  }

  static async deleteCampaign(id: string): Promise<void> {
    try {
      if (typeof window === "undefined") {
        throw new Error("Cannot access Firestore on server side")
      }

      console.log("Attempting to delete campaign:", id)

      // First, try to get the campaign to verify it exists and user has access
      const campaignDoc = await getDoc(doc(db, "campaigns", id))

      if (!campaignDoc.exists()) {
        throw new Error("Campaign not found")
      }

      const campaignData = campaignDoc.data()
      console.log("Campaign data:", campaignData)

      await deleteDoc(doc(db, "campaigns", id))
      console.log("Campaign deleted successfully")
    } catch (error: any) {
      console.error("Delete campaign error details:", {
        error: error.message,
        code: error.code,
        campaignId: id,
      })

      // Provide more specific error messages
      if (error.code === "permission-denied") {
        throw new Error(
          "You don't have permission to delete this campaign. Please check if you're the campaign owner and logged in.",
        )
      } else if (error.code === "not-found") {
        throw new Error("Campaign not found or has already been deleted.")
      } else if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(
          "Insufficient permissions to delete this campaign. Please ensure you're logged in and own this campaign.",
        )
      } else {
        throw new Error(`Failed to delete campaign: ${error.message}`)
      }
    }
  }

  // Completely separated donation recording function
  static async recordDonationOnly(donation: Omit<Donation, "id" | "createdAt">): Promise<boolean> {
    try {
      if (typeof window === "undefined") {
        console.log("Server-side donation recording - using mock data")
        return false
      }

      console.log("Recording donation only:", donation)

      // Add donation record with better error handling
      const donationRef = await addDoc(collection(db, "donations"), {
        ...donation,
        createdAt: serverTimestamp(),
        status: "recorded",
        campaignUpdated: false, // Flag to indicate campaign stats need updating
      })

      console.log("Donation recorded with ID:", donationRef.id)
      return true
    } catch (error: any) {
      console.error("Failed to record donation:", error)

      // Store in localStorage as fallback
      storePendingDonation({
        ...donation,
        recordType: "donation_only",
      })

      return false
    }
  }

  // Completely separated campaign update function
  static async updateCampaignStats(campaignId: string, amount: number): Promise<boolean> {
    try {
      if (typeof window === "undefined") {
        console.log("Server-side campaign update - skipping")
        return false
      }

      console.log("Updating campaign stats:", campaignId, amount)

      // First check if campaign exists
      const campaignRef = doc(db, "campaigns", campaignId)
      const campaignSnap = await getDoc(campaignRef)

      if (!campaignSnap.exists()) {
        console.error("Campaign not found:", campaignId)
        return false
      }

      // Try to update with increment
      await updateDoc(campaignRef, {
        raised: increment(amount),
        donors: increment(1),
        updatedAt: serverTimestamp(),
      })

      console.log("Campaign stats updated successfully")
      return true
    } catch (error: any) {
      console.error("Failed to update campaign stats:", error)

      // Store in localStorage as fallback
      storePendingDonation({
        campaignId,
        amount,
        recordType: "campaign_stats",
      })

      return false
    }
  }

  // Main donation recording function that calls the separated functions
  static async recordDonation(donation: Omit<Donation, "id" | "createdAt">): Promise<void> {
    try {
      if (typeof window === "undefined") {
        console.log("Server-side donation recording - using mock data")
        return
      }

      console.log("Recording donation:", donation)

      // Step 1: Record the donation document
      const donationRecorded = await this.recordDonationOnly(donation)

      // Step 2: Update campaign stats (only if donation was recorded)
      if (donationRecorded) {
        try {
          await this.updateCampaignStats(donation.campaignId, donation.amount)
        } catch (statsError) {
          console.error("Campaign stats update failed, but donation was recorded:", statsError)
          // Don't throw error - donation was still recorded
        }
      }

      // Even if both fail, we've stored in localStorage, so don't throw error
      // This ensures the donation flow continues for the user
    } catch (error: any) {
      console.error("Record donation error:", error)

      // Final fallback - store everything in localStorage
      storePendingDonation(donation)

      // Don't throw error to prevent breaking the donation flow
    }
  }

  static async getCampaignsByCreator(creatorId: string): Promise<Campaign[]> {
    try {
      if (typeof window === "undefined") {
        return mockCampaigns
      }

      const q = query(collection(db, "campaigns"), where("creatorId", "==", creatorId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return mockCampaigns.filter((c) => c.creatorId === creatorId)
      }

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          endDate: safeToDate(data.endDate),
        } as Campaign
      })
    } catch (error) {
      console.error("Get campaigns by creator error:", error)
      return mockCampaigns.filter((c) => c.creatorId === creatorId)
    }
  }

  static async getCampaignsSimple(limitCount = 10): Promise<Campaign[]> {
    try {
      if (typeof window === "undefined") {
        return mockCampaigns
      }

      // Most basic query possible - just get documents
      const q = query(collection(db, "campaigns"), limit(limitCount))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return mockCampaigns
      }

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          endDate: safeToDate(data.endDate),
        } as Campaign
      })
    } catch (error) {
      console.error("Get campaigns simple error:", error)
      return mockCampaigns
    }
  }
}
