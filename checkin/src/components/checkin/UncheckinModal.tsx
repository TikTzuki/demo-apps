"use client";

import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {Member} from "@/lib/types";
import {AlertTriangle} from "lucide-react";

interface UncheckinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    member: Member | null;
    teamName: string;
    isLoading?: boolean;
}

export function UncheckinModal({
                                   isOpen,
                                   onClose,
                                   onConfirm,
                                   member,
                                   teamName,
                                   isLoading,
                               }: UncheckinModalProps) {
    if (!member) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-warning" size={32}/>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Hủy check-in?
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-lg font-semibold text-gray-900">
                        {member.name.split("(")[0].trim()}
                    </p>
                    <p className="text-gray-500">{teamName}</p>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                    Bạn có chắc muốn hủy check-in của thành viên này?
                </p>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Không
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-1"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Hủy check-in"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
