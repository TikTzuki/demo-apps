import type {Metadata, Viewport} from "next";
import "./globals.css";

export const metadata: Metadata = {

    title: "Chấm công | Newera.Inc",
    description: "Hệ thống chấm công và quản lý giờ OT của Newera.Inc",
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
