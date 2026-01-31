"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Member, Team} from "@/lib/types";
import {MemberBubble} from "@/components/bubble/MemberBubble";
import {ConfirmModal} from "@/components/checkin/ConfirmModal";
import {ArrowLeft} from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isCheckinLoading, setIsCheckinLoading] = useState(false);

    const fetchTeam = async () => {
        try {
            const res = await fetch(`/api/teams/${teamId}`);
            const data = await res.json();

            if (data.success) {
                setTeam(data.data);
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [teamId]);

    const handleCheckin = async () => {
        if (!selectedMember || !team) return;

        setIsCheckinLoading(true);
        try {
            const res = await fetch("/api/checkin", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    teamId: team.id,
                    memberId: selectedMember.id,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Navigate to success page
                router.push(
                    `/success?name=${encodeURIComponent(selectedMember.name)}&team=${encodeURIComponent(team.name)}`
                );
            } else {
                alert(data.error || "Không thể check-in");
                setSelectedMember(null);
                fetchTeam();
            }
        } catch (error) {
            console.error("Error checking in:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsCheckinLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Đang tải...</div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Team không tồn tại</div>
            </div>
        );
    }

    const checkedIn = team.members.filter((m) => m.checkedIn).length;

    return (
        <div className="min-h-screen p-4 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/">
                    <button
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <ArrowLeft className="text-white" size={20}/>
                    </button>
                </Link>
                <div className="flex-1 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                        {team.name}
                    </h1>
                    <p className="text-white/80 text-sm">
                        {checkedIn}/{team.members.length} đã check-in
                    </p>
                </div>
                <div className="w-10"/>
                {/* Spacer for centering */}
            </div>

            {/* Member Bubbles */}
            <div className="flex flex-wrap justify-center gap-4">
                {team.members.map((member, index) => (
                    <MemberBubble
                        key={member.id}
                        member={member}
                        teamColor={team.color}
                        index={index}
                        onClick={() => !member.checkedIn && setSelectedMember(member)}
                        disabled={isCheckinLoading}
                    />
                ))}
            </div>

            {/* Footer hint */}
            <p className="text-center text-white/60 text-sm mt-8">
                Chọn tên của bạn để check-in
            </p>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                onConfirm={handleCheckin}
                member={selectedMember}
                team={team}
                isLoading={isCheckinLoading}
            />
        </div>
    );
}
