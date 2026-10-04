/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Android emulator and LAN access during local development.
  allowedDevOrigins: [
    "10.0.2.2",
    "localhost",
    "127.0.0.1",
    "*.local",
    "*.ngrok-free.app",
  ],
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
