"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  profession?: string;
  bio?: string;
  profilePicture?: string;
}

interface ProfileFormData {
  fullName: string;
  profession: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    fullName: "",
    profession: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const initializeProfile = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token) {
        router.push("/");
        return;
      }

      try {
        // Fetch fresh user data from API
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const { user: freshUser } = await response.json();
          setUser(freshUser);
          setProfileForm({
            fullName: freshUser.fullName || "",
            profession: freshUser.profession || "",
            bio: freshUser.bio || "",
          });
        } else if (userData) {
          // Fallback to stored data
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setProfileForm({
            fullName: parsedUser.fullName || "",
            profession: parsedUser.profession || "",
            bio: parsedUser.bio || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setProfileForm({
            fullName: parsedUser.fullName || "",
            profession: parsedUser.profession || "",
            bio: parsedUser.bio || "",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      setMessage({ type: "error", text: "Full name is required" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update profile",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setMessage({ type: "error", text: "All password fields are required" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters long",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update password",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setProfileForm({
      fullName: user?.fullName || "",
      profession: user?.profession || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  const handleProfilePictureSuccess = (imageUrl: string) => {
    setUser((prev) => (prev ? { ...prev, profilePicture: imageUrl } : prev));
    setMessage({
      type: "success",
      text: "Profile picture updated successfully!",
    });

    // Update localStorage
    if (user) {
      const updatedUser = { ...user, profilePicture: imageUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const handleProfilePictureError = (error: string) => {
    setMessage({ type: "error", text: error });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} onCreateTask={() => router.push("/dashboard")} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-8">
            <div className="flex items-center space-x-6">
              <ProfilePictureUpload
                currentPicture={user?.profilePicture}
                userName={user?.fullName || ""}
                onUploadSuccess={handleProfilePictureSuccess}
                onUploadError={handleProfilePictureError}
              />
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user?.fullName}</h1>
                <p className="text-slate-200">{user?.email}</p>
                {user?.profession && (
                  <p className="text-slate-200 text-sm mt-1">
                    {user.profession}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-slate-500 text-slate-600 dark:text-slate-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "password"
                    ? "border-slate-500 text-slate-600 dark:text-slate-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Password & Security
              </button>
            </nav>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mx-6 mt-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                  : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              }`}
            >
              <div className="flex">
                <div className="shrink-0">
                  {message.type === "success" ? (
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Information Tab */}
          {activeTab === "profile" && (
            <div className="p-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-2"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="text-lg text-gray-900 dark:text-white">
                        {user?.fullName || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="text-lg text-gray-900 dark:text-white">
                        {user?.email || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profession
                      </label>
                      <div className="text-lg text-gray-900 dark:text-white">
                        {user?.profession || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <div className="text-gray-900 dark:text-white">
                      {user?.bio ? (
                        <p className="whitespace-pre-wrap">{user.bio}</p>
                      ) : (
                        <p className="text-gray-500 italic">No bio provided</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Edit Profile Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profession"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Profession
                      </label>
                      <input
                        type="text"
                        id="profession"
                        value={profileForm.profession}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            profession: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Software Developer, Designer"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="p-6">
              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-6 max-w-md"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Change Password
                  </h2>
                </div>

                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Current Password *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    minLength={6}
                    required
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
