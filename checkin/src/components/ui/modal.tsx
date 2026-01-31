"use client";

import {cn} from "@/lib/utils";
import {X} from "lucide-react";
import {useEffect} from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export function Modal({isOpen, onClose, children, className}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div
                className={cn(
                    "relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-bounce-in",
                    className
                )}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                    <X size={20}/>
                </button>
                {children}
            </div>
        </div>
    );
}
