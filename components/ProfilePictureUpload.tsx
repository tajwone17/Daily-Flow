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

      if (response.ok) {
        onUploadSuccess(data.profilePicture);
        setPreviewUrl(null);
      } else {
        onUploadError(data.message || "Failed to upload image");
        setPreviewUrl(null);
      }
    } catch {
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
    <div className="flex items-center space-x-4">
      <div className="relative">
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Preview"
              width={80}
              height={80}
              className="rounded-full border-4 border-white shadow-lg"
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
          />
        ) : (
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-2xl font-bold text-slate-600">
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

      <div className="flex flex-col space-y-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-slate-600 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {currentPicture ? "Change Picture" : "Upload Picture"}
        </button>

        {currentPicture && (
          <button
            onClick={handleRemovePicture}
            disabled={isUploading}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Remove Picture
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
