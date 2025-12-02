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
    const { fullName, email, password, step } = body || {};

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

    // Step 1: Send OTP for email verification
    if (!step || step === "send-otp") {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.isEmailVerified) {
        return new Response(
          JSON.stringify({
            message: "User already exists with verified email",
          }),
          {
            status: 400,
          }
        );
      }

      // Generate OTP
      const { generateOTP, createOTPEmailTemplate, emailService } =
        await import("@/lib/emailService");
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash password for temporary storage
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update or create user with OTP (not verified yet)
      await User.findOneAndUpdate(
        { email },
        {
          fullName,
          email,
          password: hashedPassword,
          emailOTP: otp,
          emailOTPExpiry: otpExpiry,
          isEmailVerified: false,
        },
        { upsert: true, new: true }
      );

      // Send OTP email
      const emailTemplate = createOTPEmailTemplate(otp, fullName);
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: "Verify Your Email - Daily Flow",
        html: emailTemplate,
      });

      if (!emailResult) {
        return new Response(
          JSON.stringify({ message: "Failed to send OTP email" }),
          { status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          message:
            "OTP sent to your email. Please verify to complete registration.",
          step: "verify-otp",
        }),
        { status: 200 }
      );
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
