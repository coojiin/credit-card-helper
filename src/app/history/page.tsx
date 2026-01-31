'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getCardDefinition } from '@/lib/calculator';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { getBankColor } from '@/lib/utils';
import { Trash2, ChevronLeft, ChevronRight, NotebookPen, Edit2, Check, X, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calculate range
    const start = startOfMonth(currentMonth).getTime();
    const end = endOfMonth(currentMonth).getTime();

    // Query transactions within range
    const transactions = useLiveQuery(() =>
        db.transactions
            .where('timestamp')
            .between(start, end, true, true)
            .reverse()
            .toArray(),
        [currentMonth]
    );

    const formatMonth = (date: Date) => {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">消費紀錄</h1>

            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-6">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="text-lg font-bold text-gray-800">
                    {formatMonth(currentMonth)}
                </div>

                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Stats Summary */}
            {transactions && (
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-sm mb-6 flex justify-between">
                    <div>
                        <div className="text-blue-100 text-xs">本月累積消費</div>
                        <div className="text-2xl font-bold">
                            ${transactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-blue-100 text-xs">本月預估回饋</div>
                        <div className="text-2xl font-bold">
                            ${transactions.reduce((acc, t) => acc + t.earnedReward, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {(!transactions || transactions.length === 0) && (
                    <div className="text-center text-gray-500 py-10">
                        本月暫無紀錄
                    </div>
                )}

                {transactions?.map(tx => {
                    return <TransactionItem key={tx.id} tx={tx} />;
                })}
            </div>
        </div>
    );
}

function TransactionItem({ tx }: { tx: any }) {
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editAmount, setEditAmount] = useState(tx.amount);
    const [editReward, setEditReward] = useState(tx.earnedReward);
    // Derived Rate state for UI convenience
    const [editRate, setEditRate] = useState(tx.amount > 0 ? ((tx.earnedReward / tx.amount) * 100).toFixed(1) : "0");
    const [editNote, setEditNote] = useState(tx.note || "");

    const userCard = useLiveQuery(() => db.userCards.get(tx.userCardId));

    // Update local state when tx changes or mode toggles
    useEffect(() => {
        setEditAmount(tx.amount);
        setEditReward(tx.earnedReward);
        setEditRate(tx.amount > 0 ? ((tx.earnedReward / tx.amount) * 100).toFixed(1) : "0");
        setEditNote(tx.note || "");
    }, [tx, isEditing]);

    const handleSave = async () => {
        const newReward = parseFloat(editReward) || 0;
        const newAmount = parseFloat(editAmount) || 0;

        await db.transactions.update(tx.id, {
            amount: newAmount,
            earnedReward: newReward,
            note: editNote
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (confirm('確定刪除此筆紀錄？')) {
            await db.transactions.delete(tx.id);
        }
    };

    // Auto-update reward if rate changes
    const handleRateChange = (val: string) => {
        setEditRate(val);
        const rate = parseFloat(val);
        if (!isNaN(rate) && editAmount > 0) {
            setEditReward((editAmount * (rate / 100)).toFixed(1)); // Approx
        }
    };

    // Auto-update rate if reward changes
    const handleRewardChange = (val: string) => {
        setEditReward(val);
        const reward = parseFloat(val);
        if (!isNaN(reward) && editAmount > 0) {
            setEditRate(((reward / editAmount) * 100).toFixed(2));
        }
    };

    const handleAmountChange = (val: string) => {
        setEditAmount(val);
        // keep rate constant? or keep reward constant? 
        // usually users tweak amount, maybe rate stays same?
        const rate = parseFloat(editRate);
        const amt = parseFloat(val);
        if (!isNaN(rate) && !isNaN(amt)) {
            setEditReward((amt * (rate / 100)).toFixed(1));
        }
    };

    if (!userCard) return null;
    const def = getCardDefinition(userCard.cardDefId);
    const bankName = def?.bank || "Unknown";
    const cardName = def?.name || "Unknown Card";
    const bankColor = getBankColor(bankName);

    if (isEditing) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-100 relative z-10">
                <div className="mb-3 font-bold text-gray-800 text-sm">編輯紀錄 - {cardName}</div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-gray-500">消費金額 ($)</label>
                        <input
                            type="number"
                            className="w-full bg-gray-50 rounded p-2 text-gray-900 font-bold border focus:border-blue-500 outline-none"
                            value={editAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-blue-600 font-bold">回饋調整 ($)</label>
                        <input
                            type="number"
                            className="w-full bg-blue-50 rounded p-2 text-blue-700 font-bold border border-blue-200 focus:border-blue-500 outline-none"
                            value={editReward}
                            onChange={(e) => handleRewardChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded">
                    <Calculator size={14} className="text-gray-400" />
                    <label className="text-xs text-gray-500 whitespace-nowrap">回饋率(%):</label>
                    <input
                        type="number"
                        className="w-16 bg-transparent border-b border-gray-300 text-center font-mono text-sm focus:border-blue-500 outline-none"
                        value={editRate}
                        onChange={(e) => handleRateChange(e.target.value)}
                    />
                    <span className="text-xs text-gray-400">%</span>
                </div>

                <div className="mb-3">
                    <label className="text-xs text-gray-500">備註</label>
                    <input
                        type="text"
                        className="w-full bg-gray-50 rounded p-2 text-gray-700 text-sm border focus:border-blue-500 outline-none"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                    />
                </div>

                <div className="flex justify-between items-center mt-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-xs font-medium flex items-center gap-1"
                    >
                        <X size={14} /> 取消
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1"
                        >
                            <Trash2 size={14} /> 刪除
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-blue-700"
                        >
                            <Check size={14} /> 儲存
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm relative group">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${bankColor}`}>
                        {bankName.substring(0, 2)}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{cardName}</div>
                        <div className="text-xs text-gray-500">
                            {format(tx.timestamp, 'MM/dd HH:mm')} · {tx.scenario}
                        </div>
                    </div>
                </div>

                <div className="text-right flex items-start gap-2">
                    <div>
                        <div className="font-bold text-gray-900 text-lg">
                            ${tx.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                            +${tx.earnedReward.toFixed(1)}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"
                        title="編輯紀錄"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>
            </div>

            {/* Note Display */}
            {tx.note && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-start gap-2 text-gray-600 text-sm">
                    <NotebookPen size={14} className="mt-0.5 text-gray-400 shrink-0" />
                    <span>{tx.note}</span>
                </div>
            )}
        </div>
    )
}
