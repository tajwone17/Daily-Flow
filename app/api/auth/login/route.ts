import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

// Validation functions
const validatePassword = (password: string): boolean => {
  return !!password && password.length >= 6;
};

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Missing email or password" }),
        { status: 400 }
      );
    }

    // Validate password
    if (!validatePassword(password)) {
      return new Response(
        JSON.stringify({
          message: "Password must be at least 6 characters long",
        }),
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    let token: string | null = null;
    if (JWT_SECRET) {
      token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    }

    return new Response(
      JSON.stringify({
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profession: user.profession,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server Error" }), {
      status: 500,
    });
  }
}
