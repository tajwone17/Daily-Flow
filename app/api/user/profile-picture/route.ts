import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
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

    // Convert file to base64 for database storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64String}`;

    console.log("Converting image to base64 for database storage");
    console.log("File type:", file.type);
    console.log("File size:", file.size, "bytes");
    console.log("Base64 size:", base64String.length, "characters");

    // Store base64 image directly in database
    user.profilePicture = dataUrl;
    await user.save();

    console.log("Profile picture uploaded successfully for user:", userId);
    return NextResponse.json({
      message: "Profile picture uploaded successfully",
      profilePicture: dataUrl,
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

    // Update user to remove profile picture (no file system cleanup needed)
    user.profilePicture = undefined;
    await user.save();
    
    console.log("Profile picture removed successfully for user:", userId);

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
