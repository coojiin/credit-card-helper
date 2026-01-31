'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Onboarding } from '@/components/Onboarding';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
    const userCards = useLiveQuery(() => db.userCards.toArray());

    // Loading state
    if (!userCards) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
                Loading...
            </div>
        );
    }

    // If no cards, show Onboarding
    if (userCards.length === 0) {
        return <Onboarding />;
    }

    return <Dashboard userCards={userCards} />;
}
