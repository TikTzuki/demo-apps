import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "CV Hub - CV Review Platform",
    description: "AI-powered CV review and JD matching platform",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AppShell>{children}</AppShell>
        </body>
        </html>
    );
}
