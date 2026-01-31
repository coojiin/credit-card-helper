'use client';

import { useState, useEffect } from 'react';
import { UserCard, RecommendationResult } from '@/types';
import { calculateRecommendation } from '@/lib/calculator';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingCart, Zap, Fuel, Globe, Plane, Coffee, CreditCard, Apple, Store, MapPin } from 'lucide-react';

const SCENARIOS = [
    { id: 'general', label: '一般消費', icon: ShoppingCart },
    { id: 'convenience_store', label: '便利商店', icon: Coffee },
    { id: 'supermarket', label: '超市/量販', icon: ShoppingCart },
    { id: 'gas', label: '加油', icon: Fuel },
    { id: 'online', label: '網購', icon: Globe },
    { id: 'travel_japan', label: '日本旅遊', icon: Plane },
    { id: 'travel_korea', label: '韓國旅遊', icon: Plane },
    { id: 'travel_thailand', label: '泰國旅遊', icon: Plane },
    { id: 'travel_overseas', label: '海外消費(其他)', icon: MapPin },
    { id: 'dining', label: '餐廳', icon: Store },
    { id: 'department_store', label: '百貨', icon: CreditCard },
    { id: 'mobile_pay', label: '行動支付', icon: Zap },
    { id: 'entertainment', label: '影音串流', icon: Apple },
];

export function Dashboard({ userCards }: { userCards: UserCard[] }) {
    const [amountStr, setAmountStr] = useState('1000');
    const [note, setNote] = useState('');
    const [scenario, setScenario] = useState('general');
    const [results, setResults] = useState<RecommendationResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const calc = async () => {
            setLoading(true);
            const val = parseFloat(amountStr) || 0;
            const res: RecommendationResult[] = [];

            for (const card of userCards) {
                try {
                    const r = await calculateRecommendation(card, scenario, val);
                    res.push(r);
                } catch (e) {
                    console.error(e);
                }
            }
            res.sort((a, b) => b.estimatedReward - a.estimatedReward || b.effectiveRate - a.effectiveRate);
            setResults(res);
            setLoading(false);
        };
        calc();
    }, [userCards, amountStr, scenario]);

    const handleRecord = async (r: RecommendationResult) => {
        const val = parseFloat(amountStr) || 0;
        if (val <= 0) return;

        if (!confirm(`確定要記錄 ${r.cardDef.name} 消費 $${val} 嗎？\n預計回饋: $${r.estimatedReward.toFixed(1)}`)) {
            return;
        }

        try {
            await db.transactions.add({
                id: uuidv4(),
                userCardId: r.userCard.id,
                timestamp: Date.now(),
                amount: val,
                scenario: scenario,
                earnedReward: r.estimatedReward,
                note: note.trim()
            });
            alert("記錄成功！");
            setNote('');
            window.location.reload();
        } catch (e) {
            alert("Error recording");
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-24">
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center mb-4 text-blue-600 tracking-wider">卡利害</h1>
                <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" value={amountStr} onChange={e => setAmountStr(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-100 font-mono text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="輸入金額" />
                </div>
                <div className="relative mb-4">
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-100 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="備註 (例如: 買午餐)..." />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {SCENARIOS.map(s => {
                        const Icon = s.icon;
                        const isActive = scenario === s.id;
                        return (
                            <button key={s.id} onClick={() => setScenario(s.id)} className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}>
                                <Icon size={20} />
                                <span className="text-xs">{s.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {results.map((r, idx) => {
                    return (
                        <div key={r.userCard.id} className="bg-white p-4 rounded-xl shadow-sm relative overflow-hidden">
                            {idx === 0 && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl">BEST</div>}

                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{r.cardDef.name}</h3>
                                    <p className="text-sm text-gray-500">{r.cardDef.bank}</p>
                                    {r.schemeName && <div className="mt-1 inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded border border-blue-200">建議使用: {r.schemeName}</div>}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{r.effectiveRate.toFixed(1)}%</div>
                                    <div className="text-xs text-gray-400">回饋率</div>
                                </div>
                            </div>

                            {/* Breakdown: Show parts (e.g. 1% + 2% Note) */}
                            <div className="mb-3 flex flex-wrap gap-2">
                                {r.rateBreakdown?.map((part, i) => (
                                    <div key={i} className={`text-xs px-2 py-1 rounded border flex items-center gap-1
                                    ${part.isCapped ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    >
                                        <span className="font-bold">{part.rate}%</span>
                                        {part.note && <span>{part.note}</span>}
                                        {part.isCapped && <span>(已達上限)</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Cap Progress */}
                            {r.capInfo && r.capInfo.map(cap => (
                                <div key={cap.capGroupId} className="mb-2">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>加碼額度剩餘</span>
                                        <span>${cap.remaining.toFixed(0)} / ${cap.total}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${cap.remaining < 100 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, (cap.remaining / cap.total) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center mb-3">
                                <div>
                                    <span className="text-gray-500 text-sm">預估回饋</span>
                                    <div className="font-bold text-gray-800">${r.estimatedReward.toFixed(1)}</div>
                                </div>
                            </div>

                            {r.warningMessage && <div className="mb-3 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Warning: {r.warningMessage}</div>}

                            <button onClick={() => handleRecord(r)} className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-medium active:bg-gray-700">記帳並累積</button>
                        </div>
                    )
                })}
                {results.length === 0 && !loading && <div className="text-center text-gray-500 mt-10">沒有找到卡片</div>}
            </div>
        </div>
    );
}
