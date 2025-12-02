import { connectDB } from "@/lib/dbConnect";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email } = body || {};

    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), {
        status: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    if (user.isEmailVerified) {
      return new Response(
        JSON.stringify({ message: "Email is already verified" }),
        { status: 400 }
      );
    }

    // Generate new OTP
    const { generateOTP, createOTPEmailTemplate, emailService } = await import(
      "@/lib/emailService"
    );
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.emailOTP = otp;
    user.emailOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailTemplate = createOTPEmailTemplate(otp, user.fullName);
    const emailResult = await emailService.sendEmail({
      to: email,
      subject: "Verify Your Email - Daily Flow (Resent)",
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
        message: "OTP resent to your email successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
