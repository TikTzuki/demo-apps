/** @type {import('next').NextConfig} */

// The desktop (Tauri) build exports a fully static site that Tauri serves from
// the app bundle. The web (Docker) build keeps the default server runtime so
// the /api proxy route and SSR continue to work.
const isDesktop = process.env.DESKTOP_BUILD === "1";

const nextConfig = isDesktop
    ? {
        output: "export",
        // No Next.js image optimization server in a static bundle.
        images: {unoptimized: true},
        // Emit `route/index.html` so file-based serving resolves clean URLs.
        trailingSlash: true,
    }
    : {};

module.exports = nextConfig;
