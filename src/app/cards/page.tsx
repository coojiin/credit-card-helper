'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CARD_DEFS } from '@/lib/calculator';
import { useState } from 'react';
import { getBankColor } from '@/lib/utils';
import { Check, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function CardsPage() {
    const userCards = useLiveQuery(() => db.userCards.toArray());
    const [searchTerm, setSearchTerm] = useState('');

    // Helper to check if user already has this card info
    const isCardAdded = (defId: string) => userCards?.some(uc => uc.cardDefId === defId);

    const handleToggleCard = async (defId: string) => {
        const existing = userCards?.find(uc => uc.cardDefId === defId);
        if (existing) {
            // Remove
            await db.userCards.delete(existing.id);
        } else {
            // Add with default
            const def = CARD_DEFS.find(c => c.id === defId);
            if (def) {
                await db.userCards.add({
                    id: uuidv4(),
                    cardDefId: defId,
                    billingCycleDay: def.defaultBillingCycleDay || 1,
                    isEnabled: true
                });
            }
        }
    };

    const filteredCards = CARD_DEFS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bank.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-24 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">管理卡片</h1>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 shadow-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="搜尋銀行或卡片名稱..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredCards.map(card => {
                    const added = isCardAdded(card.id);
                    const bankColor = getBankColor(card.bank);

                    return (
                        <div
                            key={card.id}
                            onClick={() => handleToggleCard(card.id)}
                            className={`flex items-center p-4 rounded-xl transition-all cursor-pointer border-2
                       ${added
                                    ? 'bg-white border-blue-500 shadow-md transform scale-[1.01]'
                                    : 'bg-white border-transparent shadow-sm opacity-80 hover:opacity-100'}`}
                        >
                            {/* Card Preview / Icon */}
                            <div className={`w-16 h-10 rounded-md shadow-sm mr-4 flex items-center justify-center text-[10px] text-white font-bold text-center leading-tight p-1 ${bankColor}`}>
                                {card.name.substring(0, 4)}...
                            </div>

                            <div className="flex-1">
                                <div className="font-bold text-gray-900">{card.name}</div>
                                <div className="text-sm text-gray-500">{card.bank}</div>
                            </div>

                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${added ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                {added && <Check size={14} className="text-white" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
