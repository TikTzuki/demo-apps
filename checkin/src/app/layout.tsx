import type {Metadata, Viewport} from "next";
import {Archivo, IBM_Plex_Mono} from "next/font/google";
import "./globals.css";

const archivo = Archivo({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-archivo",
    display: "swap",
});

// Numeric columns only — digits line up down a column, which plain
// proportional figures do not do in a timesheet.
const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-plex-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Chấm công | Newera.Inc",
    description: "Hệ thống chấm công và quản lý giờ OT của Newera.Inc",
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#0c0c0e",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={`${archivo.variable} ${plexMono.variable}`}>
        <body className="antialiased safe-top safe-bottom">{children}</body>
        </html>
    );
}
