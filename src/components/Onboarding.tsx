'use client';

import { useState } from 'react';
import { CARD_DEFS } from '@/lib/calculator'; // We exposed it there
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function Onboarding() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleCard = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) return;

        // Bulk add
        const cardsToAdd = Array.from(selectedIds).map(defId => {
            const def = CARD_DEFS.find(c => c.id === defId);
            return {
                id: uuidv4(),
                cardDefId: defId,
                billingCycleDay: def?.defaultBillingCycleDay || 1, // Default
                isEnabled: true
            };
        });

        await db.userCards.bulkAdd(cardsToAdd);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">歡迎使用</h1>
            <p className="text-gray-600 mb-6">請選擇您目前持有的信用卡：</p>

            <div className="flex-1 space-y-4 overflow-y-auto mb-4 pb-20">
                {CARD_DEFS.map(card => {
                    const isSelected = selectedIds.has(card.id);
                    return (
                        <div
                            key={card.id}
                            onClick={() => toggleCard(card.id)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4
                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            {/* Placeholder for Image */}
                            <div className="w-12 h-8 bg-gray-300 rounded overflow-hidden flex-shrink-0" />

                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{card.name}</h3>
                                <p className="text-sm text-gray-500">{card.bank}</p>
                            </div>

                            {isSelected && (
                                <div className="text-blue-600">
                                    ✓
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="sticky bottom-0 bg-gray-50 pt-4 pb- safe-area-inset-bottom">
                <button
                    onClick={handleSubmit}
                    disabled={selectedIds.size === 0}
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform shadow-lg mb-20"
                >
                    開始使用 ({selectedIds.size})
                </button>
            </div>
        </div>
    );
}
