'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CARD_DEFS } from '@/lib/calculator';
import { useState } from 'react';
import { getBankColor } from '@/lib/utils';
import { Check, Search, Calendar, Trash2, Plus, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function CardsPage() {
    const userCards = useLiveQuery(() => db.userCards.toArray());
    const [searchTerm, setSearchTerm] = useState('');

    // Update Billing Cycle Day
    const updateBillingDay = async (id: string, day: number) => {
        if (day < 1 || day > 31) return;
        await db.userCards.update(id, { billingCycleDay: day });
    };

    // Toggle Card (Add/Remove)
    const handleAddCard = async (defId: string) => {
        const def = CARD_DEFS.find(c => c.id === defId);
        if (def) {
            await db.userCards.add({
                id: uuidv4(),
                cardDefId: defId,
                billingCycleDay: def.defaultBillingCycleDay || 1,
                isEnabled: true
            });
        }
    };

    const handleRemoveCard = async (userCardId: string) => {
        if (confirm('確定要移除這張卡片嗎？相關設定將會遺失。')) {
            await db.userCards.delete(userCardId);
        }
    };

    // Separate added cards from available cards
    const myCards = userCards || [];
    const myCardDefIds = new Set(myCards.map(uc => uc.cardDefId));

    const availableCards = CARD_DEFS.filter(c =>
        !myCardDefIds.has(c.id) &&
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.bank.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-24 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">管理卡片</h1>

            {/* Section 1: My Cards */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
                    <CreditCard size={16} />
                    我的卡片 ({myCards.length})
                </h2>

                {myCards.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200 mb-4">
                        <div className="text-gray-400 text-sm">尚未新增任何卡片</div>
                        <div className="text-gray-300 text-xs mt-1">請從下方選擇卡片加入</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {myCards.map(uc => {
                            const def = CARD_DEFS.find(c => c.id === uc.cardDefId);
                            if (!def) return null;
                            const bankColor = getBankColor(def.bank);

                            return (
                                <div key={uc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-8 rounded-md shadow-sm flex items-center justify-center text-[10px] text-white font-bold ${bankColor}`}>
                                                {def.bank.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-base">{def.name}</div>
                                                <div className="text-xs text-gray-500">{def.bank}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCard(uc.id)}
                                            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Billing Day Settings Inline */}
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={16} />
                                            <span className="text-xs font-medium">結帳日設定</span>
                                        </div>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                        <select
                                            value={uc.billingCycleDay}
                                            onChange={(e) => updateBillingDay(uc.id, parseInt(e.target.value))}
                                            className="bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>每月 {d} 號</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Section 2: Add Cards */}
            <section>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                        <Plus size={16} />
                        新增更多卡片
                    </h2>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 shadow-sm text-gray-900 focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                        placeholder="搜尋銀行或卡片名稱..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {availableCards.map(card => {
                        const bankColor = getBankColor(card.bank);

                        return (
                            <button
                                key={card.id}
                                onClick={() => handleAddCard(card.id)}
                                className="flex items-center p-3 rounded-xl bg-white border border-transparent hover:border-blue-300 shadow-sm active:scale-[0.99] transition-all text-left group"
                            >
                                <div className={`w-10 h-6.5 rounded shadow-sm mr-3 flex items-center justify-center text-[8px] text-white font-bold ${bankColor}`}>
                                    {card.name.substring(0, 2)}
                                </div>

                                <div className="flex-1">
                                    <div className="font-bold text-gray-700 text-sm group-hover:text-blue-600 transition-colors">{card.name}</div>
                                    <div className="text-[10px] text-gray-400">{card.bank}</div>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Plus size={18} />
                                </div>
                            </button>
                        );
                    })}
                    {availableCards.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            沒有找到符合的卡片
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
