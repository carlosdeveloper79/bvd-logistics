/** @type {import('next').NextConfig} */
const nextConfig = {
  // No standalone output — Amplify manages its own SSR packaging
  turbopack: {}
};

export default nextConfig;
