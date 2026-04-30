import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text"  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;
        try {
          const connectDB         = (await import("./mongodb")).default;
          const { default: Otp }  = await import("@/models/Otp");
          const { default: User } = await import("@/models/User");

          await connectDB();

          const record = await Otp.findOne({ email: credentials.email });
          if (!record) return null;
          if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ email: credentials.email });
            return null;
          }
          if (record.otp !== credentials.otp) return null;
          await Otp.deleteOne({ email: credentials.email });

          const user = await User.findOne({ email: credentials.email });
          if (!user) return null;

          return {
            id:    user._id.toString(),
            name:  user.name,
            email: user.email,
            role:  user.role,
            image: user.image ?? null,
          };
        } catch (err) {
          console.error("Auth error:", err);
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
      if (token && session.user) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.AUTH_SECRET,
});
