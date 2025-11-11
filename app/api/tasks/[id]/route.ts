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

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const userId = getUserFromToken(request);
    if (!userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Await the params Promise
    const resolvedParams = await params;

    // Validate ObjectId format
    if (!resolvedParams.id || !resolvedParams.id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ message: "Invalid task ID format" }),
        { status: 400 }
      );
    }

    console.log("Getting task:", { taskId: resolvedParams.id, userId });

    // First check if task exists
    const taskWithoutUserId = await Task.findOne({ _id: resolvedParams.id });
    console.log("Task exists check (GET):", {
      taskId: resolvedParams.id,
      userId,
      taskExists: !!taskWithoutUserId,
      taskUserId: taskWithoutUserId?.userId?.toString(),
      userIdMatch: taskWithoutUserId?.userId?.toString() === userId,
    });

    const task = await Task.findOne({ _id: resolvedParams.id, userId });

    if (!task) {
      console.log("Task not found (GET):", {
        taskId: resolvedParams.id,
        userId,
      });
      return new Response(
        JSON.stringify({
          message: "Task not found or you don't have permission to view it",
        }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ task }), { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const userId = getUserFromToken(request);
    if (!userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Await the params Promise
    const resolvedParams = await params;

    // Validate ObjectId format
    if (!resolvedParams.id || !resolvedParams.id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ message: "Invalid task ID format" }),
        { status: 400 }
      );
    }

    console.log("Updating task:", { taskId: resolvedParams.id, userId });

    const body = await request.json();
    const { title, description, startTime, endTime, priority, completed } =
      body;

    // Validate time range if both times are provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return new Response(
          JSON.stringify({ message: "End time must be after start time" }),
          { status: 400 }
        );
      }
    }

    const updateData: {
      title?: string;
      description?: string;
      startTime?: Date;
      endTime?: Date;
      priority?: string;
      completed?: boolean;
    } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (priority !== undefined) updateData.priority = priority;
    if (completed !== undefined) updateData.completed = completed;

    // First check if task exists
    const taskWithoutUserId = await Task.findOne({ _id: resolvedParams.id });
    console.log("Task exists check:", {
      taskId: resolvedParams.id,
      userId,
      taskExists: !!taskWithoutUserId,
      taskUserId: taskWithoutUserId?.userId?.toString(),
      userIdMatch: taskWithoutUserId?.userId?.toString() === userId,
    });

    // Then check if task exists and belongs to user
    const existingTask = await Task.findOne({ _id: resolvedParams.id, userId });

    if (!existingTask) {
      console.log("Task not found or access denied:", {
        taskId: resolvedParams.id,
        userId,
      });
      return new Response(
        JSON.stringify({
          message: "Task not found or you don't have permission to edit it",
        }),
        { status: 404 }
      );
    }

    const task = await Task.findOneAndUpdate(
      { _id: resolvedParams.id, userId },
      updateData,
      { new: true }
    );

    if (!task) {
      return new Response(
        JSON.stringify({ message: "Failed to update task" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Task updated successfully",
        task,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const userId = getUserFromToken(request);
    if (!userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Await the params Promise
    const resolvedParams = await params;

    const task = await Task.findOneAndDelete({
      _id: resolvedParams.id,
      userId,
    });

    if (!task) {
      return new Response(JSON.stringify({ message: "Task not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Task deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}
