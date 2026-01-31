"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {Member, Team} from "@/lib/types";
import {MemberListItem} from "@/components/stats/MemberListItem";
import {UncheckinModal} from "@/components/checkin/UncheckinModal";
import {ArrowLeft, UserCheck, Users, UserX} from "lucide-react";
import Link from "next/link";

export default function TeamDetailPage() {
    const params = useParams();
    const teamId = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isUncheckinLoading, setIsUncheckinLoading] = useState(false);

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

        // Auto refresh
        const interval = setInterval(fetchTeam, 5000);
        return () => clearInterval(interval);
    }, [teamId]);

    const handleUncheckin = async () => {
        if (!selectedMember) return;

        setIsUncheckinLoading(true);
        try {
            const res = await fetch(`/api/checkin/${selectedMember.id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (data.success) {
                setSelectedMember(null);
                fetchTeam();
            } else {
                alert(data.error || "Không thể hủy check-in");
            }
        } catch (error) {
            console.error("Error unchecking in:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsUncheckinLoading(false);
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

    const checkedInMembers = team.members.filter((m) => m.checkedIn);
    const uncheckedMembers = team.members.filter((m) => !m.checkedIn);

    return (
        <div className="min-h-screen p-4 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/stats">
                    <button
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <ArrowLeft className="text-white" size={20}/>
                    </button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">{team.name}</h1>
                    <p className="text-white/80 text-sm">
                        {checkedInMembers.length}/{team.members.length} đã check-in
                    </p>
                </div>
                <div
                    className="w-10 h-10 rounded-full"
                    style={{backgroundColor: team.color}}
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Users className="text-white mx-auto mb-1" size={20}/>
                    <p className="text-white text-xl font-bold">{team.members.length}</p>
                    <p className="text-white/70 text-xs">Tổng</p>
                </div>
                <div className="bg-success/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <UserCheck className="text-success mx-auto mb-1" size={20}/>
                    <p className="text-white text-xl font-bold">
                        {checkedInMembers.length}
                    </p>
                    <p className="text-white/70 text-xs">Đã check-in</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                    <UserX className="text-white/70 mx-auto mb-1" size={20}/>
                    <p className="text-white text-xl font-bold">
                        {uncheckedMembers.length}
                    </p>
                    <p className="text-white/70 text-xs">Chưa check-in</p>
                </div>
            </div>

            {/* Checked-in Members */}
            {checkedInMembers.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <UserCheck size={18} className="text-success"/>
                        Đã check-in ({checkedInMembers.length})
                    </h2>
                    <div className="space-y-2">
                        {checkedInMembers.map((member) => (
                            <MemberListItem
                                key={member.id}
                                member={member}
                                onUncheckin={() => setSelectedMember(member)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Unchecked Members */}
            {uncheckedMembers.length > 0 && (
                <div>
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <UserX size={18} className="text-white/70"/>
                        Chưa check-in ({uncheckedMembers.length})
                    </h2>
                    <div className="space-y-2">
                        {uncheckedMembers.map((member) => (
                            <MemberListItem
                                key={member.id}
                                member={member}
                                showUncheckin={false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Uncheckin Modal */}
            <UncheckinModal
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                onConfirm={handleUncheckin}
                member={selectedMember}
                teamName={team.name}
                isLoading={isUncheckinLoading}
            />
        </div>
    );
}
