import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// POST - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("profilePicture") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Please upload an image file" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size should be less than 5MB" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log("Upload directory creation:", error);
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error("File write error:", error);
      return NextResponse.json(
        { message: "Failed to save file" },
        { status: 500 }
      );
    }

    // Remove old profile picture if it exists
    if (user.profilePicture) {
      try {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          user.profilePicture
        );
        await unlink(oldFilePath);
      } catch (err) {
        // Old file might not exist
        console.log("Could not delete old profile picture:", err);
      }
    }

    // Update user with new profile picture path
    const profilePictureUrl = `/uploads/profiles/${fileName}`;
    console.log("Saving profile picture URL:", profilePictureUrl);
    console.log("File saved to:", filePath);

    user.profilePicture = profilePictureUrl;
    await user.save();

    console.log("Profile picture uploaded successfully for user:", userId);
    return NextResponse.json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePictureUrl,
    });
  } catch (err) {
    console.error("Profile picture upload error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove profile picture
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Remove profile picture file if it exists
    if (user.profilePicture) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          user.profilePicture
        );
        await unlink(filePath);
      } catch (err) {
        // File might not exist
        console.log("Could not delete profile picture file:", err);
      }
    }

    // Update user to remove profile picture
    user.profilePicture = undefined;
    await user.save();

    return NextResponse.json({
      message: "Profile picture removed successfully",
    });
  } catch (err) {
    console.error("Profile picture removal error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
