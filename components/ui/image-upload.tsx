"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface ImageUploadProps {
  onChange: (file: File) => void
  value?: string
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onChange, value, disabled }) => {
  const [fileUrl, setFileUrl] = useState<string | undefined>(value)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]

      if (!file) {
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      setFileUrl(URL.createObjectURL(file))
      onChange(file)
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif", ".svg"],
    },
    disabled,
  })

  return (
    <div className="relative w-full">
      <div
        {...getRootProps()}
        className={`
          relative
          flex
          items-center
          justify-center
          w-full
          p-4
          text-center
          border-2
          border-dashed
          rounded-md
          cursor-pointer
          transition
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
          ${isDragActive ? "border-primary-500" : "border-gray-300"}
        `}
      >
        <input {...getInputProps()} />
        {fileUrl ? (
          <img
            src={fileUrl || "/placeholder.svg"}
            alt="Uploaded"
            className="
              absolute
              top-0
              left-0
              object-cover
              w-full
              h-full
              rounded-md
            "
          />
        ) : (
          <p className="text-gray-500">
            {isDragActive ? "Drop the image here..." : "Click or drag an image to upload"}
          </p>
        )}
      </div>
    </div>
  )
}

export default ImageUpload
export { ImageUpload }
