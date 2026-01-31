import type {Metadata, Viewport} from "next";
import "./globals.css";

export const metadata: Metadata = {

    title: "Hackathon Check-in | Newera.Inc",
    description: "Check-in cho sự kiện Hackathon 2026",
    icons: {
        icon: "/favicon.ico",
    }
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#667eea",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
        <body className="antialiased safe-top safe-bottom">{children}</body>
        </html>
    );
}
