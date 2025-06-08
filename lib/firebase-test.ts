import { auth, db } from "./firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export async function testFirebaseConnection() {
  try {
    console.log("Testing Firebase connection...")

    // Test Firestore
    const testDocRef = doc(db, "test", "connection")
    await setDoc(testDocRef, {
      timestamp: new Date(),
      test: "Firebase connection successful",
    })

    const testDoc = await getDoc(testDocRef)
    console.log("Firestore test successful:", testDoc.data())

    // Test Auth
    console.log("Auth instance:", auth)
    console.log("Project ID:", auth.app.options.projectId)

    return {
      success: true,
      firestore: true,
      auth: true,
      projectId: auth.app.options.projectId,
    }
  } catch (error) {
    console.error("Firebase connection test failed:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
