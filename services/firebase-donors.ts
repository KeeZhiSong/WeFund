import { collection, query, orderBy, getDocs, where, doc, getDoc, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/types/database"

export interface DonorStats {
  uid: string
  displayName: string
  email: string
  profileImage?: string
  totalDonated: number
  donationsCount: number
  lastDonationDate?: Date
  firstDonationDate?: Date
  averageDonation?: number
  largestDonation?: number
  campaignsSupported?: number
  badges?: string[]
}

export class DonorService {
  private static async checkFirebaseAvailability(): Promise<boolean> {
    try {
      if (!db) {
        console.log("Firebase not initialized")
        return false
      }

      // Test Firebase connection with a simple query
      const testQuery = query(collection(db, "users"), limit(1))
      await getDocs(testQuery)
      return true
    } catch (error) {
      console.log("Firebase not available:", error)
      return false
    }
  }

  static async getTopDonors(limitCount = 50): Promise<DonorStats[]> {
    try {
      // Check if Firebase is available
      const isAvailable = await this.checkFirebaseAvailability()
      if (!isAvailable) {
        console.log("Firebase not available, returning empty donors list")
        return []
      }

      // Query users collection ordered by totalDonated in descending order
      const q = query(
        collection(db, "users"),
        where("totalDonated", ">", 0),
        orderBy("totalDonated", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const userData = doc.data() as User

        return {
          uid: doc.id,
          displayName: userData.displayName || "Anonymous",
          email: userData.email,
          profileImage: userData.profileImage,
          totalDonated: userData.totalDonated || 0,
          donationsCount: userData.donationsCount || 0,
          lastDonationDate: userData.lastDonationDate ? new Date(userData.lastDonationDate) : undefined,
          firstDonationDate: userData.firstDonationDate ? new Date(userData.firstDonationDate) : undefined,
          averageDonation: userData.donationsCount ? userData.totalDonated / userData.donationsCount : undefined,
          badges: this.calculateBadges(userData),
        }
      })
    } catch (error) {
      console.error("Error fetching top donors:", error)

      // Return empty array instead of throwing error
      return []
    }
  }

  static async getDonorById(donorId: string): Promise<DonorStats | null> {
    try {
      // Check if Firebase is available
      const isAvailable = await this.checkFirebaseAvailability()
      if (!isAvailable) {
        console.log("Firebase not available, returning null for donor")
        return null
      }

      const docRef = doc(db, "users", donorId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const userData = docSnap.data() as User

      return {
        uid: docSnap.id,
        displayName: userData.displayName || "Anonymous",
        email: userData.email,
        profileImage: userData.profileImage,
        totalDonated: userData.totalDonated || 0,
        donationsCount: userData.donationsCount || 0,
        lastDonationDate: userData.lastDonationDate ? new Date(userData.lastDonationDate) : undefined,
        firstDonationDate: userData.firstDonationDate ? new Date(userData.firstDonationDate) : undefined,
        averageDonation: userData.donationsCount ? userData.totalDonated / userData.donationsCount : undefined,
        badges: this.calculateBadges(userData),
      }
    } catch (error) {
      console.error("Error fetching donor:", error)
      return null
    }
  }

  static async searchDonors(searchTerm: string, maxResults = 10): Promise<DonorStats[]> {
    try {
      // Check if Firebase is available
      const isAvailable = await this.checkFirebaseAvailability()
      if (!isAvailable) {
        console.log("Firebase not available, returning empty search results")
        return []
      }

      // This is a simple implementation that gets all donors and filters in memory
      // For production, you would want to use a more efficient search method like Algolia or Firebase's full-text search
      const allDonors = await this.getTopDonors(100)

      return allDonors
        .filter(
          (donor) =>
            donor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donor.email.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, maxResults)
    } catch (error) {
      console.error("Error searching donors:", error)
      return []
    }
  }

  private static calculateBadges(user: User): string[] {
    const badges: string[] = []

    // Calculate badges based on donation activity
    if (user.totalDonated && user.totalDonated >= 10000) badges.push("platinum")
    else if (user.totalDonated && user.totalDonated >= 5000) badges.push("gold")
    else if (user.totalDonated && user.totalDonated >= 1000) badges.push("silver")
    else if (user.totalDonated && user.totalDonated >= 100) badges.push("bronze")

    if (user.donationsCount && user.donationsCount >= 50) badges.push("frequent")
    if (user.campaignsCreated && user.campaignsCreated > 0) badges.push("creator")

    return badges
  }
}
