"use client";

import {useSearchParams} from "next/navigation";
import {Suspense, useEffect, useRef} from "react";
import {Button} from "@/components/ui/button";
import {CuteFace} from "@/components/cute/CuteFace";
import {Confetti} from "@/components/cute/Confetti";
import Link from "next/link";

function SuccessContent() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "Bạn";
    const team = searchParams.get("team") || "";
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Play success sound
        audioRef.current = new Audio("/sounds/success.mp3");
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {
            // Ignore autoplay errors
        });
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <Confetti trigger={true}/>

            {/* Celebration icons */}
            <div className="text-4xl mb-4 animate-bounce">
                🎊 🎉 🎊 🎉 🎊
            </div>

            {/* Success message */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-6">
                <div className="text-5xl mb-4">✨✨✨</div>
                <CuteFace size="lg" expression="excited" className="text-white mb-4"/>
                <h1 className="text-3xl font-bold text-white mb-2">CHECK-IN</h1>
                <h2 className="text-2xl font-bold text-white mb-6">THÀNH CÔNG!</h2>
                <div className="text-5xl mb-4">✨✨✨</div>

                <div className="bg-white/10 rounded-xl p-4 mt-4">
                    <p className="text-white/80 text-sm mb-1">Chào mừng</p>
                    <p className="text-white text-xl font-bold">
                        {name.split("(")[0].trim()}
                    </p>
                    {team && <p className="text-white/80 text-sm mt-1">{team}</p>}
                </div>
            </div>

            {/* More celebration */}
            <div className="text-4xl mb-6 animate-bounce" style={{animationDelay: "0.2s"}}>
                🎊 🎉 🎊 🎉 🎊
            </div>

            {/* Back button */}
            <Link href="/">
                <Button variant="default" size="lg">
                    Về trang chủ
                </Button>
            </Link>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-white text-xl">Đang tải...</div>
                </div>
            }
        >
            <SuccessContent/>
        </Suspense>
    );
}
