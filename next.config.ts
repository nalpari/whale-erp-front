import type { NextConfig } from "next";

const S3_HOSTNAME =
  process.env.NEXT_PUBLIC_S3_HOSTNAME ||
  "whale-erp-files.s3.ap-northeast-2.amazonaws.com";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: S3_HOSTNAME,
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
