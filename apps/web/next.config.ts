import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@peoplepay360/db", "@peoplepay360/validation"]
};

export default nextConfig;
