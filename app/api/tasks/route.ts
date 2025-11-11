import { connectDB } from "@/lib/dbConnect";
import Task from "@/app/models/Task";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || !JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// GET /api/tasks - Get all tasks for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = getUserFromToken(request);
    if (!userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const tasks = await Task.find({ userId }).sort({ startTime: 1 });

    console.log(
      "Fetched tasks:",
      tasks.map((t) => ({ id: t._id, title: t.title }))
    );

    return new Response(JSON.stringify({ tasks }), { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = getUserFromToken(request);
    if (!userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { title, description, startTime, endTime, priority } = body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({
          message: "Title, start time, and end time are required",
        }),
        { status: 400 }
      );
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return new Response(
        JSON.stringify({ message: "End time must be after start time" }),
        { status: 400 }
      );
    }

    console.log("Creating task with userId:", { userId, type: typeof userId });

    const task = await Task.create({
      title,
      description: description || "",
      startTime: start,
      endTime: end,
      priority: priority || "Medium",
      userId,
    });

    console.log("Created task:", {
      taskId: task._id,
      taskUserId: task.userId,
      taskUserIdType: typeof task.userId,
    });

    return new Response(
      JSON.stringify({
        message: "Task created successfully",
        task,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}
