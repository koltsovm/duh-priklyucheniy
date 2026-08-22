/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@duh/shared"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000" },
    ],
  },
};

export default nextConfig;