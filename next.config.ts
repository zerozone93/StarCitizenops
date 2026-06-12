import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "127.0.0.1:3001",
        "*.app.github.dev",
      ],
    },
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
    ],
  },
  // Compress responses
  compress: true,
  async redirects() {
    return [
      {
        source: "/USER_GUIDE.md",
        destination: "/user-guide",
        permanent: true,
      },
    ];
  },
  // Let Next.js manage static asset cache headers to avoid dev/runtime conflicts.
};

export default nextConfig;
