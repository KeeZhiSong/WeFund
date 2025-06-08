import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Donation } from "@/types/database"

export interface TransactionStats {
  totalTransactions: number
  totalDonated: number
  totalReceived: number
  pendingTransactions: number
}

export class TransactionService {
  static async getUserTransactions(
    userId: string,
    type: "all" | "sent" | "received" = "all",
    timeFilter: "all" | "week" | "month" | "year" = "all",
  ): Promise<Donation[]> {
    try {
      // Check if Firebase is available
      if (!db) {
        console.warn("Firebase not available, returning empty array")
        return []
      }

      let allTransactions: Donation[] = []

      // Get sent transactions (where user is the donor)
      if (type === "all" || type === "sent") {
        try {
          const sentQuery = query(
            collection(db, "donations"),
            where("donorId", "==", userId),
            orderBy("createdAt", "desc"),
          )
          const sentSnapshot = await getDocs(sentQuery)
          const sentTransactions = sentSnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as Donation,
          )
          allTransactions = [...allTransactions, ...sentTransactions]
        } catch (error) {
          console.warn("Error fetching sent transactions, donations collection may not exist:", error)
        }
      }

      // Get received transactions (where user is the campaign creator)
      if (type === "all" || type === "received") {
        try {
          // First get campaigns created by this user
          const campaignsQuery = query(collection(db, "campaigns"), where("creatorId", "==", userId))
          const campaignsSnapshot = await getDocs(campaignsQuery)
          const userCampaignIds = campaignsSnapshot.docs.map((doc) => doc.id)

          // Then get donations to those campaigns
          if (userCampaignIds.length > 0) {
            const receivedQuery = query(
              collection(db, "donations"),
              where("campaignId", "in", userCampaignIds),
              orderBy("createdAt", "desc"),
            )
            const receivedSnapshot = await getDocs(receivedQuery)
            const receivedTransactions = receivedSnapshot.docs.map(
              (doc) =>
                ({
                  id: doc.id,
                  ...doc.data(),
                }) as Donation,
            )
            allTransactions = [...allTransactions, ...receivedTransactions]
          }
        } catch (error) {
          console.warn("Error fetching received transactions:", error)
        }
      }

      // Remove duplicates (in case a user donated to their own campaign)
      const uniqueTransactions = allTransactions.filter(
        (transaction, index, self) => index === self.findIndex((t) => t.id === transaction.id),
      )

      // Apply time filter
      let filteredTransactions = uniqueTransactions
      if (timeFilter !== "all") {
        const now = new Date()
        let startDate: Date

        switch (timeFilter) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startDate = new Date(0)
        }

        filteredTransactions = uniqueTransactions.filter((transaction) => {
          const transactionDate = transaction.createdAt?.toDate
            ? transaction.createdAt.toDate()
            : new Date(transaction.createdAt)
          return transactionDate >= startDate
        })
      }

      return filteredTransactions
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
  }

  static async getTransactionStats(userId: string): Promise<TransactionStats> {
    try {
      const [sentTransactions, receivedTransactions] = await Promise.all([
        this.getUserTransactions(userId, "sent"),
        this.getUserTransactions(userId, "received"),
      ])

      const totalDonated = sentTransactions.reduce((sum, t) => sum + t.amount, 0)
      const totalReceived = receivedTransactions.reduce((sum, t) => sum + t.amount, 0)
      const pendingTransactions = [...sentTransactions, ...receivedTransactions].filter(
        (t) => !t.transactionHash,
      ).length

      return {
        totalTransactions: sentTransactions.length + receivedTransactions.length,
        totalDonated,
        totalReceived,
        pendingTransactions,
      }
    } catch (error) {
      console.error("Error fetching transaction stats:", error)
      return {
        totalTransactions: 0,
        totalDonated: 0,
        totalReceived: 0,
        pendingTransactions: 0,
      }
    }
  }
}
