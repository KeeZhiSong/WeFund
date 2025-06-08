export interface User {
  uid: string
  email: string
  displayName: string
  walletAddress?: string
  createdAt: Date
  updatedAt: Date
  role: "donor" | "campaigner" | "admin"
  profileImage?: string
  profileImageId?: string
  isVerified: boolean
  emailVerificationSent?: boolean
  emailVerificationSentAt?: Date
  emailVerifiedAt?: Date
  totalDonated?: number
  totalRaised?: number
  campaignsCreated?: number
  donationsCount?: number
}

export interface Campaign {
  id: string
  title: string
  description: string
  image: string
  imageId?: string
  galleryImageIds?: string[]
  goal: number
  raised: number
  donors: number
  daysLeft: number
  category: "Medical" | "Community" | "Business" | "Education"
  walletAddress: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
  status: "active" | "completed" | "paused"
  endDate: Date
}

export interface Donation {
  id: string
  campaignId: string
  donorId: string
  amount: number
  transactionHash: string
  walletAddress: string
  createdAt: Date
  message?: string
}

export interface WalletConnection {
  userId: string
  walletAddress: string
  isVerified: boolean
  connectedAt: Date
  lastUsed: Date
}
