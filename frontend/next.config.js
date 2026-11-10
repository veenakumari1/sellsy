/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["images.unsplash.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

