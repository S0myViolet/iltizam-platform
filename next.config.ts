import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory. Without this, Turbopack infers
  // the root from lockfiles in parent folders and — when this repo sits inside
  // another JS project — starts compiling that project's files (middleware,
  // etc.) as if they belonged to this app.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
