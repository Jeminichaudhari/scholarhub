import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        try {
          await connectDB();

          // Password was already verified in /api/auth/send-otp
          // Here we only verify the OTP
          const record = await Otp.findOne({ email: credentials.email });

          if (!record) return null;
          if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ email: credentials.email });
            return null;
          }
          if (record.otp !== credentials.otp) return null;

          // OTP correct — consume it
          await Otp.deleteOne({ email: credentials.email });

          const user = await User.findOne({ email: credentials.email });
          if (!user) return null;

          return {
            id:    user._id.toString(),
            name:  user.name,
            email: user.email,
            role:  user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});
