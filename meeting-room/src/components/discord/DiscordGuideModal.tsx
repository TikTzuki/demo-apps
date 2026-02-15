"use client";

import {Modal} from "@/components/ui/modal";
import {Button} from "@/components/ui/button";
import {useTranslation} from "@/lib/i18n/context";

const DISCORD_INVITE_URL =
    "https://discord.com/oauth2/authorize?client_id=1075266036829540442&scope=applications.commands+bot&permissions=9073118501888";

interface DiscordGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DiscordGuideModal({isOpen, onClose}: DiscordGuideModalProps) {
    const {t} = useTranslation();

    function handleAddBot() {
        window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer");
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div>
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <svg className="h-7 w-7 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24"
                         fill="currentColor">
                        <path
                            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                </div>
                <h2 className="mb-5 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("discord.guideTitle")}
                </h2>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <p>{t("discord.guideStep1")}</p>

                    <div>
                        <p>{t("discord.guideStep2")}</p>
                        <code
                            className="mt-1.5 block rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            /link tag:myorg4
                        </code>
                    </div>

                    <p>{t("discord.guideStep3")}</p>

                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t("discord.guideUnlink")}</p>
                        <code
                            className="mt-1.5 block rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            /unlink tag:myorg4
                        </code>
                    </div>
                </div>

                <Button
                    variant="primary"
                    onClick={handleAddBot}
                    className="mt-6 w-full"
                >
                    {t("discord.addBot")}
                </Button>
            </div>
        </Modal>
    );
}