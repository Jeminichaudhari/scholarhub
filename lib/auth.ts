import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authConfig = {
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
          const connectDB = (await import("./mongodb")).default;
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
    async jwt({ token, user }: any) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
