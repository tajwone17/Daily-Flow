import mongoose, { Schema, models } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    completed: { type: Boolean, default: false },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reminder: {
      enabled: { type: Boolean, default: false },
      time: { type: Date, required: false }, // Absolute reminder time
      minutesBefore: { type: Number, default: 15 }, // Minutes before task start
      notified: { type: Boolean, default: false }, // Track if notification was sent
    },
  },
  { timestamps: true }
);

// Create index for better query performance
taskSchema.index({ userId: 1, startTime: 1 });

const Task = models.Task || mongoose.model("Task", taskSchema);
export default Task;
