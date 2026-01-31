'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, History, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: '推薦', icon: Home },
        { href: '/history', label: '紀錄', icon: History },
        { href: '/cards', label: '卡片', icon: CreditCard }, // New page for managing cards
        { href: '/settings', label: '設定', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-20 pb-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon size={24} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
