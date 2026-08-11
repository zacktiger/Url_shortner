import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Emit .next/standalone — a self-contained server bundle with only the
  // node_modules actually imported. This is what the Docker image copies.
  output: "standalone",

  // Explicitly set the absolute turbopack root to silence root inference conflicts
  // caused by parent directory lockfiles (e.g. C:\Users\kshit\package-lock.json)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
