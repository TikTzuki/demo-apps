"use client";

import {cn} from "@/lib/utils";
import {Member} from "@/lib/types";
import {Check} from "lucide-react";

interface MemberBubbleProps {
    member: Member;
    teamColor: string;
    index: number;
    onClick: () => void;
    disabled?: boolean;
}

export function MemberBubble({
                                 member,
                                 teamColor,
                                 index,
                                 onClick,
                                 disabled,
                             }: MemberBubbleProps) {
    const delayClass = `bubble-delay-${(index % 8) + 1}`;

    return (
        <button
            onClick={onClick}
            disabled={disabled || member.checkedIn}
            className={cn(
                "flex flex-col items-center justify-center",
                "w-24 h-24 sm:w-28 sm:h-28 rounded-full",
                "shadow-lg transition-all",
                "animate-float",
                delayClass,
                member.checkedIn
                    ? "bg-success cursor-default opacity-80"
                    : "cursor-pointer hover:scale-110 active:scale-95",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
                backgroundColor: member.checkedIn ? undefined : teamColor,
            }}
        >
            {member.checkedIn && (
                <Check className="text-white mb-1" size={20} strokeWidth={3}/>
            )}
            <span className="text-white font-medium text-xs sm:text-sm text-center px-2 drop-shadow-md leading-tight">
        {member.name}
      </span>
            {member.checkedIn && (
                <span className="text-white/80 text-[10px] mt-0.5">Đã check-in</span>
            )}
        </button>
    );
}
