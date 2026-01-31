"use client";

import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {Member, Team} from "@/lib/types";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    member: Member | null;
    team: Team | null;
    isLoading?: boolean;
}

export function ConfirmModal({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                                 member,
                                 team,
                                 isLoading,
                             }: ConfirmModalProps) {
    if (!member || !team) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Xác nhận check-in?
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-lg font-semibold text-gray-900">
                        {member.name.split("(")[0].trim()}
                    </p>
                    <p className="text-gray-500">{team.name}</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="success"
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Check-in"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
