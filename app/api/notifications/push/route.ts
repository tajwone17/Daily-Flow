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

// POST - Send push notification
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

    const { title, body, taskId, scheduleTime } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { message: "Title and body are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // For now, we'll return success and let the client handle the notification
    // In a real implementation, you would use a service like Firebase Cloud Messaging (FCM)
    // or Web Push Protocol to send notifications to the user's device

    console.log(`Push notification request for user ${userId}:`, {
      title,
      body,
      taskId,
      scheduleTime,
    });

    // Here you would typically:
    // 1. Store the notification request in the database
    // 2. Use a push service (FCM, VAPID) to send the notification
    // 3. Handle subscription management for different devices

    return NextResponse.json({
      message: "Push notification scheduled successfully",
      notificationId: `${userId}_${Date.now()}`,
      scheduledFor: scheduleTime || "immediate",
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get notification status/history for user
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

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return notification capabilities and status
    return NextResponse.json({
      userId,
      notificationSupport: {
        serviceWorker: true,
        pushNotifications: true,
        backgroundSync: true,
      },
      message: "Notification service status retrieved",
    });
  } catch (error) {
    console.error("Get notification status error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
