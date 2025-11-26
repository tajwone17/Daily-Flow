import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token and return user ID
export function verifyTokenId(request: NextRequest): string | null {
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

// Helper function to verify JWT token and return full user object
export async function verifyToken(request: NextRequest) {
  const userId = verifyTokenId(request);

  if (!userId) {
    return null;
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
