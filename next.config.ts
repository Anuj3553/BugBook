import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { // Enable experimental features
    staleTimes: { // Configure the stale time for the cache
      dynamic: 30, // Set the stale time for dynamic pages to 30 seconds
    },
  },
  // Describe in the lucia documentation
  serverExternalPackages: ["@node-rs/argon2"], // Add the argon2 package to the server
  images: { // Configure the image loader
    remotePatterns: [ // Match any image URL
      {
        protocol: "https", // Match any protocol
        hostname: "utfs.io", // Match the hostname
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/*`, // Match the pathname
      },
    ],
  },
  rewrites: async () => { // Define the rewrites
    return [ // Return an array of rewrites
      {
        source: "/hashtag/:tag", // Match the hashtag route
        destination: "/search?q=%23:tag", // Redirect to the search route with the hashtag query
      },
    ];
  }
};

export default nextConfig;
