import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly set the absolute turbopack root to silence root inference conflicts
  // caused by parent directory lockfiles (e.g. C:\Users\kshit\package-lock.json)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
