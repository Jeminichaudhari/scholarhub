/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "mongoose",
    "bcryptjs",
    "nodemailer",
    "@auth/core",
    "next-auth",
  ],
};

export default nextConfig;
