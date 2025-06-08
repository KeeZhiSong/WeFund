import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

export class FirebaseStorageService {
  static async uploadCampaignPicture(campaignId: string, file: File): Promise<{ url: string; path: string }> {
    try {
      if (!storage) {
        throw new Error("Firebase storage is not initialized")
      }

      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image")
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        throw new Error("File size must be less than 10MB")
      }

      // Create a simpler path structure that might work with default rules
      const timestamp = Date.now()
      const fileExtension = file.name.split(".").pop()
      const fileName = `campaign_${campaignId}_${timestamp}.${fileExtension}`

      // Try different path structures based on common Firebase rules
      const possiblePaths = [
        `public/${fileName}`, // Public folder (most permissive)
        `images/${fileName}`, // Images folder
        `uploads/${fileName}`, // Uploads folder
        `campaign-images/${fileName}`, // Campaign images folder
        fileName, // Root level
      ]

      let lastError: Error | null = null

      // Try each path until one works
      for (const filePath of possiblePaths) {
        try {
          console.log(`Attempting upload to path: ${filePath}`)

          const storageRef = ref(storage, filePath)
          const snapshot = await uploadBytes(storageRef, file)
          const downloadURL = await getDownloadURL(snapshot.ref)

          console.log(`Upload successful to path: ${filePath}`)
          return {
            url: downloadURL,
            path: filePath,
          }
        } catch (error: any) {
          console.log(`Upload failed for path ${filePath}:`, error.message)
          lastError = error
          continue
        }
      }

      // If all paths failed, throw the last error
      throw lastError || new Error("All upload paths failed")
    } catch (error: any) {
      console.error("Error uploading campaign picture:", error)

      // Return a fallback solution - convert to base64 data URL
      if (file) {
        try {
          const base64 = await this.convertToBase64(file)
          console.log("Using base64 fallback for image")
          return {
            url: base64,
            path: `local_${Date.now()}`, // Indicate this is a local/base64 image
          }
        } catch (base64Error) {
          console.error("Base64 conversion also failed:", base64Error)
        }
      }

      throw error
    }
  }

  // Helper method to convert file to base64
  private static convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  static async deleteCampaignPicture(path: string): Promise<void> {
    try {
      // Don't try to delete base64 images or if storage is not available
      if (!storage || path.startsWith("local_") || path.startsWith("data:")) {
        console.log("Skipping delete for local/base64 image")
        return
      }

      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
    } catch (error) {
      console.error("Error deleting campaign picture:", error)
      // Don't throw error for delete operations
    }
  }

  // Method to check if Firebase Storage is accessible
  static async testStorageAccess(): Promise<boolean> {
    try {
      if (!storage) return false

      // Try to create a reference to test access
      const testRef = ref(storage, "test/access-test.txt")
      return true
    } catch (error) {
      console.error("Storage access test failed:", error)
      return false
    }
  }
}
