import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";
import { emailService } from "@/lib/emailService";

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

// POST - Send email reminder
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

    const { taskTitle, taskDescription, startTime, endTime } =
      await request.json();

    if (!taskTitle || !startTime) {
      return NextResponse.json(
        { message: "Task title and start time are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json(
        { message: "User email not found" },
        { status: 400 }
      );
    }

    // Send email reminder to user's registered email
    const emailSent = await emailService.sendTaskReminder(
      user.email, // Send TO user's registration email
      user.fullName || "User",
      taskTitle,
      taskDescription || "",
      startTime,
      endTime || startTime
    );

    if (emailSent) {
      return NextResponse.json({
        message: "Email reminder sent successfully",
        recipient: user.email,
        taskTitle,
      });
    } else {
      return NextResponse.json(
        { message: "Failed to send email reminder" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Test email service connection
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Test email service connection
    const isConnected = await emailService.verifyConnection();

    return NextResponse.json({
      emailService: {
        connected: isConnected,
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        user: process.env.EMAIL_USER
          ? `${process.env.EMAIL_USER.substring(0, 3)}***`
          : "Not set",
      },
    });
  } catch (error) {
    console.error("Email service test error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
