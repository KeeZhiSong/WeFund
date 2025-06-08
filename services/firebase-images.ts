import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ImageMetadata {
  id: string
  url: string
  storagePath: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: Date
  type: "profile" | "campaign" | "campaign-gallery"
  entityId: string // userId for profile, campaignId for campaign
  isActive: boolean
  alt?: string
  caption?: string
}

export class ImageDatabaseService {
  /**
   * Save image metadata to database
   */
  static async saveImageMetadata(metadata: Omit<ImageMetadata, "id" | "uploadedAt">): Promise<string> {
    try {
      const docRef = doc(collection(db, "images"))
      const imageData: ImageMetadata = {
        ...metadata,
        id: docRef.id,
        uploadedAt: new Date(),
      }

      await setDoc(docRef, imageData)
      return docRef.id
    } catch (error) {
      console.error("Save image metadata error:", error)
      throw error
    }
  }

  /**
   * Get image metadata by ID
   */
  static async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    try {
      const docRef = doc(db, "images", imageId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? (docSnap.data() as ImageMetadata) : null
    } catch (error) {
      console.error("Get image metadata error:", error)
      return null
    }
  }

  /**
   * Get user's profile picture
   */
  static async getUserProfilePicture(userId: string): Promise<ImageMetadata | null> {
    try {
      const q = query(
        collection(db, "images"),
        where("entityId", "==", userId),
        where("type", "==", "profile"),
        where("isActive", "==", true),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) return null

      // Return the most recent profile picture
      const images = querySnapshot.docs.map((doc) => doc.data() as ImageMetadata)
      return images.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0]
    } catch (error) {
      console.error("Get user profile picture error:", error)
      return null
    }
  }

  /**
   * Get campaign images
   */
  static async getCampaignImages(campaignId: string): Promise<{
    mainImage: ImageMetadata | null
    gallery: ImageMetadata[]
  }> {
    try {
      const q = query(collection(db, "images"), where("entityId", "==", campaignId), where("isActive", "==", true))
      const querySnapshot = await getDocs(q)

      const images = querySnapshot.docs.map((doc) => doc.data() as ImageMetadata)

      const mainImage = images.find((img) => img.type === "campaign") || null
      const gallery = images
        .filter((img) => img.type === "campaign-gallery")
        .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())

      return { mainImage, gallery }
    } catch (error) {
      console.error("Get campaign images error:", error)
      return { mainImage: null, gallery: [] }
    }
  }

  /**
   * Update image metadata
   */
  static async updateImageMetadata(imageId: string, updates: Partial<ImageMetadata>): Promise<void> {
    try {
      await updateDoc(doc(db, "images", imageId), updates)
    } catch (error) {
      console.error("Update image metadata error:", error)
      throw error
    }
  }

  /**
   * Deactivate old profile pictures when uploading a new one
   */
  static async deactivateOldProfilePictures(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "images"),
        where("entityId", "==", userId),
        where("type", "==", "profile"),
        where("isActive", "==", true),
      )
      const querySnapshot = await getDocs(q)

      const updatePromises = querySnapshot.docs.map((doc) => updateDoc(doc.ref, { isActive: false }))

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Deactivate old profile pictures error:", error)
      throw error
    }
  }

  /**
   * Delete image metadata
   */
  static async deleteImageMetadata(imageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "images", imageId))
    } catch (error) {
      console.error("Delete image metadata error:", error)
      throw error
    }
  }

  /**
   * Get all images uploaded by a user
   */
  static async getUserImages(userId: string): Promise<ImageMetadata[]> {
    try {
      const q = query(collection(db, "images"), where("uploadedBy", "==", userId), where("isActive", "==", true))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs
        .map((doc) => doc.data() as ImageMetadata)
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    } catch (error) {
      console.error("Get user images error:", error)
      return []
    }
  }
}
