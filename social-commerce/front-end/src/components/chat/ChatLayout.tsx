import {cn} from '@/lib/utils';

interface ChatLayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function ChatLayout({sidebar, children, className}: ChatLayoutProps) {
    return (
        <div className={cn('flex h-screen bg-background', className)}>
            <aside className="hidden md:flex md:w-64 lg:w-80 flex-col border-r">
                {sidebar}
            </aside>
            <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
    );
}
