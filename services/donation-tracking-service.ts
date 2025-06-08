import type { Donation } from "@/types/database"

// Mock data for demonstration purposes
// In a real application, this would connect to your database and blockchain API

export interface DonationTrackingResult {
  donation: {
    id: string
    amount: number
    createdAt: number
    campaign: {
      id: string
      title: string
    }
  }
  blockchainData: {
    transactionHash: string
    status: string // confirmed, pending, failed
    confirmations: number
    blockNumber: number
    fee: number
  }
  fundAllocation: {
    campaignFunds: number
    platformFee: number
    processingFee: number
  }
}

export class DonationTrackingService {
  static async trackByTransactionHash(hash: string): Promise<DonationTrackingResult | null> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock data
    return {
      donation: {
        id: "don_" + Math.random().toString(36).substring(2, 10),
        amount: 100,
        createdAt: Date.now() - 86400000, // 1 day ago
        campaign: {
          id: "camp_123",
          title: "Help Build Clean Water Wells",
        },
      },
      blockchainData: {
        transactionHash: hash,
        status: "confirmed",
        confirmations: 42,
        blockNumber: 12345678,
        fee: 0.00001,
      },
      fundAllocation: {
        campaignFunds: 96,
        platformFee: 2.5,
        processingFee: 1.5,
      },
    }
  }

  static async trackByDonationId(id: string): Promise<DonationTrackingResult | null> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock data
    return {
      donation: {
        id: id,
        amount: 50,
        createdAt: Date.now() - 172800000, // 2 days ago
        campaign: {
          id: "camp_456",
          title: "Education for Children",
        },
      },
      blockchainData: {
        transactionHash: "0x" + Math.random().toString(36).substring(2, 66),
        status: "confirmed",
        confirmations: 128,
        blockNumber: 12345600,
        fee: 0.00001,
      },
      fundAllocation: {
        campaignFunds: 48,
        platformFee: 1.25,
        processingFee: 0.75,
      },
    }
  }

  static async getUserDonations(userId: string): Promise<Donation[]> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Mock data
    return [
      {
        id: "don_" + Math.random().toString(36).substring(2, 10),
        amount: 75,
        createdAt: Date.now() - 86400000, // 1 day ago
        campaignId: "camp_123",
        campaignTitle: "Help Build Clean Water Wells",
        donorId: userId,
        status: "completed",
        transactionHash: "0x" + Math.random().toString(36).substring(2, 66),
        walletAddress: "r" + Math.random().toString(36).substring(2, 34),
      },
      {
        id: "don_" + Math.random().toString(36).substring(2, 10),
        amount: 25,
        createdAt: Date.now() - 172800000, // 2 days ago
        campaignId: "camp_456",
        campaignTitle: "Education for Children",
        donorId: userId,
        status: "completed",
        transactionHash: "0x" + Math.random().toString(36).substring(2, 66),
        walletAddress: "r" + Math.random().toString(36).substring(2, 34),
      },
      {
        id: "don_" + Math.random().toString(36).substring(2, 10),
        amount: 100,
        createdAt: Date.now() - 604800000, // 7 days ago
        campaignId: "camp_789",
        campaignTitle: "Medical Supplies for Hospital",
        donorId: userId,
        status: "completed",
        transactionHash: "0x" + Math.random().toString(36).substring(2, 66),
        walletAddress: "r" + Math.random().toString(36).substring(2, 34),
      },
    ]
  }
}
