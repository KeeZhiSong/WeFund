// This is a debugging helper function you can use to check the image upload process
export function debugImageUpload(file: File, userId: string, campaignId: string) {
  console.log("Debug Image Upload:")
  console.log("- File:", file.name, file.type, file.size)
  console.log("- User ID:", userId)
  console.log("- Campaign ID:", campaignId)

  // Check if Firebase is properly initialized
  try {
    const firebaseApp = require("@/lib/firebase").default
    const auth = require("@/lib/firebase").auth
    const db = require("@/lib/firebase").db

    console.log("- Firebase initialized:", !!firebaseApp)
    console.log("- Auth initialized:", !!auth)
    console.log("- Firestore initialized:", !!db)
  } catch (error) {
    console.error("Firebase import error:", error)
  }

  // Check environment variables
  console.log("- Firebase storage bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
}
