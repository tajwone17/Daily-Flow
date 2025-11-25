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

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profession: user.profession,
        bio: user.bio,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, profession, bio } = body;

    // Validate required fields
    if (!fullName?.trim()) {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update fields
    user.fullName = fullName.trim();
    user.profession = profession?.trim() || "";
    user.bio = bio?.trim() || "";

    await user.save();

    // Return updated user data (without password)
    const updatedUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profession: user.profession,
      bio: user.bio,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
