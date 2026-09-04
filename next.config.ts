import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.igdb.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.steamstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "shared.cloudflare.steamstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "shared.akamai.steamstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn.cloudflare.steamstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn.akamai.steamstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "steamcdn-a.akamaihd.net",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
        ],
    },
    reactCompiler: true,
};

export default nextConfig;
