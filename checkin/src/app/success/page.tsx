"use client";

import {Suspense, useEffect, useRef} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {CuteFace} from "@/components/cute/CuteFace";
import {Confetti} from "@/components/cute/Confetti";
import {formatDuration} from "@/lib/attendance/time";

function SuccessContent() {
    const searchParams = useSearchParams();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const name = searchParams.get("name") || "Bạn";
    const team = searchParams.get("team") || "";
    const action = searchParams.get("action") === "CHECK_OUT" ? "CHECK_OUT" : "CHECK_IN";
    const isOvernight = searchParams.get("kind") === "OVERNIGHT";
    const worked = Number(searchParams.get("worked") ?? 0);
    const ot = Number(searchParams.get("ot") ?? 0);
    const overnightOt = Number(searchParams.get("overnight") ?? 0);

    const isCheckOut = action === "CHECK_OUT";

    useEffect(() => {
        audioRef.current = new Audio("/sounds/success.mp3");
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {
            // Autoplay is blocked until the page has been interacted with — harmless.
        });
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <Confetti trigger={true}/>

            <div className="text-4xl mb-4 animate-bounce">
                {isOvernight ? "🌙 ⭐ 🌙 ⭐ 🌙" : "🎊 🎉 🎊 🎉 🎊"}
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 mb-6 w-full max-w-sm">
                <CuteFace size="lg" expression="excited" className="text-white mb-4"/>
                <h1 className="text-3xl font-bold text-white mb-1">
                    {isCheckOut ? "CHECK-OUT" : "CHECK-IN"}
                </h1>
                <h2 className="text-2xl font-bold text-white mb-6">THÀNH CÔNG!</h2>

                <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white/80 text-sm mb-1">
                        {isCheckOut ? "Tạm biệt" : isOvernight ? "Bắt đầu ca đêm" : "Chào mừng"}
                    </p>
                    <p className="text-white text-xl font-bold">{name.split("(")[0].trim()}</p>
                    {team && <p className="text-white/80 text-sm mt-1">{team}</p>}
                </div>

                {isCheckOut && (
                    <div className="bg-white/10 rounded-xl p-4 mt-3 text-left space-y-1">
                        <div className="flex justify-between text-white">
                            <span className="text-white/80 text-sm">Tổng giờ làm hôm nay</span>
                            <strong>{formatDuration(worked)}</strong>
                        </div>
                        {ot > 0 && (
                            <div className="flex justify-between text-white">
                                <span className="text-white/80 text-sm">Giờ OT</span>
                                <strong className="text-warning">{formatDuration(ot)}</strong>
                            </div>
                        )}
                        {overnightOt > 0 && (
                            <div className="flex justify-between text-white">
                                <span className="text-white/80 text-sm">Trong đó OT qua đêm</span>
                                <strong className="text-warning">{formatDuration(overnightOt)}</strong>
                            </div>
                        )}
                        {ot === 0 && (
                            <p className="text-white/70 text-xs pt-1">Ca làm việc tiêu chuẩn, không có OT.</p>
                        )}
                    </div>
                )}
            </div>

            <Link href="/">
                <Button variant="default" size="lg">Về trang chủ</Button>
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
