import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Emit .next/standalone — a self-contained server bundle with only the
  // node_modules actually imported — but only for the self-hosted Docker
  // image, which is the sole consumer of it (see Frontend/Dockerfile).
  //
  // This must stay opt-in. Vercel builds its own output from the
  // .next/*.nft.json file traces, and enabling standalone suppresses
  // next-server.js.nft.json, so Vercel's post-build step dies with
  // "ENOENT: ... .next/next-server.js.nft.json" *after* a successful compile.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,

  // Explicitly set the absolute turbopack root to silence root inference conflicts
  // caused by parent directory lockfiles (e.g. C:\Users\kshit\package-lock.json)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
