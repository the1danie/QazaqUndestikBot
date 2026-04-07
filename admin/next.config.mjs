/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/api/files/[filename]": ["./uploads/**"],
    },
  },
};

export default nextConfig;
