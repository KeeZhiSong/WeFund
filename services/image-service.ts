// services/image-service.ts

class ImageService {
  async uploadImage(image: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append("image", image)

      const response = await fetch("/api/upload", {
        // Replace with your actual API endpoint
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.message || "Image upload failed."
        console.error(errorMessage)
        alert(errorMessage)
        return null
      }

      const data = await response.json()
      if (data && data.imageUrl) {
        return data.imageUrl
      } else {
        console.error("Image URL not found in response.")
        alert("Image upload successful, but URL not found.")
        return null
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image: " + error)
      return null
    }
  }
}

export default new ImageService()
export { ImageService }
