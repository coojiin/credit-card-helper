'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CARD_DEFS } from '@/lib/calculator';
import { useState } from 'react';
import { getBankColor } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export default function SettingsPage() {
    const userCards = useLiveQuery(() => db.userCards.toArray());
    const [editingId, setEditingId] = useState<string | null>(null);

    const updateBillingDay = async (id: string, day: number) => {
        if (day < 1 || day > 31) return;
        await db.userCards.update(id, { billingCycleDay: day });
    };

    if (!userCards) return null;

    return (
        <div className="bg-gray-50 min-h-screen pb-24 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">結帳日設定</h1>

            <div className="space-y-4">
                {userCards.length === 0 && (
                    <div className="text-center text-gray-500 py-10">
                        尚未新增任何卡片，請至「卡片」頁面新增。
                    </div>
                )}

                {userCards.map(uc => {
                    const def = CARD_DEFS.find(c => c.id === uc.cardDefId);
                    if (!def) return null;
                    const bankColor = getBankColor(def.bank);

                    return (
                        <div key={uc.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-6 rounded shadow-sm ${bankColor}`} />
                                <div>
                                    <div className="font-bold text-gray-900">{def.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        結帳日: 每月 {uc.billingCycleDay} 號
                                    </div>
                                </div>
                            </div>

                            <select
                                value={uc.billingCycleDay}
                                onChange={(e) => updateBillingDay(uc.id, parseInt(e.target.value))}
                                className="bg-gray-100 border-none rounded-lg py-2 px-3 text-sm font-bold text-gray-700"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d} 號</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
