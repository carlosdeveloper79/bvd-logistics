import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No standalone output — Amplify manages its own SSR packaging
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
