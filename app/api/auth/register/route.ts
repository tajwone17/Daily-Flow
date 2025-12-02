import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

// Validation functions
const validatePassword = (password: string): boolean => {
  if (!password || password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { fullName, email, password } = body || {};

    if (!fullName || !email || !password) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return new Response(
        JSON.stringify({
          message:
            "Password must be at least 6 characters and contain uppercase, lowercase, and number",
        }),
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    let token: string | null = null;
    if (JWT_SECRET) {
      token = jwt.sign({ id: created._id }, JWT_SECRET, { expiresIn: "7d" });
    }

    const safeUser = {
      _id: created._id,
      fullName: created.fullName,
      email: created.email,
      profession: created.profession || null,
    };

    return new Response(
      JSON.stringify({
        message: "User registered successfully",
        user: safeUser,
        token,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}
