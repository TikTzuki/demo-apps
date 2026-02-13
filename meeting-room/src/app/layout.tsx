import type {Metadata, Viewport} from "next";
import "./globals.css";
import {Providers} from "./providers";

export const metadata: Metadata = {
    title: "Meeting Room Booking",
    description: "Book meeting rooms quickly — no login required",
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="antialiased safe-top safe-bottom">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
