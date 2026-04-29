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
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: false,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        url: false,
        assert: false,
        buffer: false,
        events: false,
        querystring: false,
        string_decoder: false,
      };
    }
    // Exclude nodemailer and mongoose from webpack bundling entirely
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push(
        "nodemailer",
        "mongoose",
        "bcryptjs",
        "@auth/core",
        "next-auth"
      );
    }
    return config;
  },
};

export default nextConfig;
