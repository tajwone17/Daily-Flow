"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ProfilePictureUploadProps {
  currentPicture?: string;
  userName: string;
  onUploadSuccess: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
}

export default function ProfilePictureUpload({
  currentPicture,
  userName,
  onUploadSuccess,
  onUploadError,
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    console.log("Starting file upload:", file.name, file.size);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("token");

      if (!token) {
        onUploadError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/user/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response status:", response.status);
      console.log("Upload response data:", data);

      if (response.ok) {
        console.log("Upload successful, new URL:", data.profilePicture);
        onUploadSuccess(data.profilePicture);
        setPreviewUrl(null);
      } else {
        console.error("Upload failed:", data.message);
        onUploadError(data.message || "Failed to upload image");
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError("Network error. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    setIsUploading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        onUploadError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/user/profile-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onUploadSuccess("");
      } else {
        const data = await response.json();
        onUploadError(data.message || "Failed to remove picture");
      }
    } catch {
      onUploadError("Network error. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
      <div className="relative">
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Preview"
              width={80}
              height={80}
              className="rounded-full border-4 border-white shadow-lg"
              unoptimized
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : currentPicture ? (
          <Image
            src={currentPicture}
            alt={userName}
            width={80}
            height={80}
            className="rounded-full border-4 border-white shadow-lg"
            unoptimized
            onError={(e) => {
              console.error("Profile image failed to load:", currentPicture);
              // Hide the broken image
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-2xl font-bold text-white">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        )}

        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col space-y-3 text-center md:text-left">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-blue-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span>{currentPicture ? "Change Picture" : "Upload Picture"}</span>
        </button>

        {currentPicture && (
          <button
            onClick={handleRemovePicture}
            disabled={isUploading}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-red-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Remove Picture</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
