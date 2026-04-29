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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundling of Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        stream: false,
        crypto: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        child_process: false,
        buffer: false,
        util: false,
      };
    }
    return config;
  },
};

export default nextConfig;
