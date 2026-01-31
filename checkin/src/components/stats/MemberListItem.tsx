"use client";

import {cn, formatTime} from "@/lib/utils";
import {Member} from "@/lib/types";
import {Check, Clock, Mail, X} from "lucide-react";

interface MemberListItemProps {
    member: Member;
    onUncheckin?: () => void;
    showUncheckin?: boolean;
}

export function MemberListItem({
                                   member,
                                   onUncheckin,
                                   showUncheckin = true,
                               }: MemberListItemProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl p-4 shadow-sm",
                "flex items-center justify-between",
                "transition-all"
            )}
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        member.checkedIn ? "bg-success/10" : "bg-gray-100"
                    )}
                >
                    {member.checkedIn ? (
                        <Check className="text-success" size={20} strokeWidth={3}/>
                    ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-300"/>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">
                        {member.name}
                    </p>
                    {member.email && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs truncate">
                            <Mail size={11} className="flex-shrink-0"/>
                            <span className="truncate">{member.email}</span>
                        </div>
                    )}
                    {member.checkedIn && member.checkedInAt && (
                        <div className="flex items-center gap-1 text-success text-xs mt-0.5">
                            <Clock size={11}/>
                            <span>{formatTime(member.checkedInAt)}</span>
                        </div>
                    )}
                </div>
            </div>

            {member.checkedIn && showUncheckin && onUncheckin && (
                <button
                    onClick={onUncheckin}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        "bg-danger/10 text-danger",
                        "hover:bg-danger/20 active:scale-95",
                        "transition-all"
                    )}
                >
                    <X size={18} strokeWidth={2.5}/>
                </button>
            )}
        </div>
    );
}
