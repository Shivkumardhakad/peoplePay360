import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@peoplepay360/db", "@peoplepay360/validation"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
