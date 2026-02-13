import type { NextConfig } from "next";

const S3_HOSTNAME =
  process.env.NEXT_PUBLIC_S3_HOSTNAME ||
  "whale-erp-files.s3.ap-northeast-2.amazonaws.com";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: S3_HOSTNAME,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
