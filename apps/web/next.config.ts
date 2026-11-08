import "@RealEstateProject/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
