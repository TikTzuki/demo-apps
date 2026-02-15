"use client";

import {useEffect, useState} from "react";
import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {useTranslation} from "@/lib/i18n/context";

interface TelegramGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TelegramGuideModal({isOpen, onClose}: TelegramGuideModalProps) {
    const {t} = useTranslation();
    const [botUsername, setBotUsername] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        fetch("/api/telegram/bot-info")
            .then((r) => r.json())
            .then((data: { username: string }) => setBotUsername(data.username))
            .catch(() => {
            });
    }, [isOpen]);

    function handleAddBot() {
        const url = `https://t.me/${botUsername || "your_bot"}`;
        window.open(url, "_blank", "noopener,noreferrer");
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div>
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                    <svg className="h-7 w-7 text-sky-500 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                </div>
                <h2 className="mb-5 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("telegram.guideTitle")}
                </h2>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <p>{t("telegram.guideStep1")}</p>

                    <div>
                        <p>{t("telegram.guideStep2")}</p>
                        <code
                            className="mt-1.5 block rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            /link myorg4
                        </code>
                    </div>

                    <p>{t("telegram.guideStep3")}</p>

                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t("telegram.guideUnlink")}</p>
                        <code
                            className="mt-1.5 block rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            /unlink myorg4
                        </code>
                    </div>
                </div>

                <Button
                    variant="primary"
                    onClick={handleAddBot}
                    className="mt-6 w-full"
                >
                    {t("telegram.addBot")}
                </Button>
            </div>
        </Modal>
    );
}
