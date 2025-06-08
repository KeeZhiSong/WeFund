"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface MultiImageUploadProps {
  onImagesUploaded: (images: File[]) => void
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ onImagesUploaded }) => {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prevFiles) => [...prevFiles, ...acceptedFiles])
      onImagesUploaded([...files, ...acceptedFiles]) // Notify parent component
      alert(`Successfully added ${acceptedFiles.length} images!`)
    },
    [files, onImagesUploaded],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const removeFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove))
    onImagesUploaded(files.filter((file) => file !== fileToRemove)) // Notify parent component
  }

  return (
    <div>
      <div
        {...getRootProps()}
        style={{ border: "1px dashed #ccc", padding: "20px", textAlign: "center", cursor: "pointer" }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here ...</p>
        ) : (
          <p>Drag 'n' drop some images here, or click to select images</p>
        )}
      </div>
      <div>
        {files.map((file) => (
          <div key={file.name} style={{ display: "flex", alignItems: "center", margin: "5px" }}>
            <img
              src={URL.createObjectURL(file) || "/placeholder.svg"}
              alt={file.name}
              style={{ width: "50px", height: "50px", marginRight: "10px" }}
            />
            <span>{file.name}</span>
            <button onClick={() => removeFile(file)} style={{ marginLeft: "10px" }}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MultiImageUpload
