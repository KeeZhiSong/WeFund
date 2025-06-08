import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { WalletConnection } from "@/types/database"

export class WalletService {
  static async connectWallet(userId: string, walletAddress: string): Promise<string> {
    try {
      // Check if wallet is already connected
      const isConnected = await this.isWalletConnected(walletAddress)
      if (isConnected) {
        throw new Error("This wallet is already connected to an account")
      }

      // Add new wallet connection
      const walletsRef = collection(db, "wallets")
      const docRef = await addDoc(walletsRef, {
        userId,
        walletAddress,
        isVerified: false,
        createdAt: serverTimestamp(),
        label: "My XRPL Wallet", // Default label
      })

      return docRef.id
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  static async verifyWallet(userId: string, walletAddress: string): Promise<void> {
    try {
      // Find the wallet document
      const walletsRef = collection(db, "wallets")
      const q = query(walletsRef, where("userId", "==", userId), where("walletAddress", "==", walletAddress))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("Wallet not found")
      }

      // Update the wallet document
      const walletDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "wallets", walletDoc.id), {
        isVerified: true,
        verifiedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error verifying wallet:", error)
      throw new Error("Failed to verify wallet")
    }
  }

  static async getUserWallets(userId: string): Promise<WalletConnection[]> {
    try {
      const walletsRef = collection(db, "wallets")
      const q = query(walletsRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WalletConnection[]
    } catch (error) {
      console.error("Error fetching user wallets:", error)
      throw new Error("Failed to fetch wallets")
    }
  }

  static async isWalletConnected(walletAddress: string): Promise<boolean> {
    try {
      const walletsRef = collection(db, "wallets")
      const q = query(walletsRef, where("walletAddress", "==", walletAddress))
      const querySnapshot = await getDocs(q)

      return !querySnapshot.empty
    } catch (error) {
      console.error("Error checking wallet connection:", error)
      throw new Error("Failed to check wallet connection")
    }
  }
}
