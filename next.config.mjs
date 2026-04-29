/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "mongoose",
    "bcryptjs",
    "nodemailer",
    "@auth/core",
    "next-auth",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
