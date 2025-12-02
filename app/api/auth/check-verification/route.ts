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

    return new Response(
      JSON.stringify({
        isVerified: user.isEmailVerified,
        hasAccount: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Check verification status error:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
