'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CARD_DEFS } from '@/lib/calculator';
import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, ShieldCheck, List, ArrowUp, ArrowDown } from 'lucide-react';
import { SCENARIOS } from '@/components/Dashboard';

export default function SettingsPage() {
    const userCards = useLiveQuery(() => db.userCards.toArray());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
    const [lastBackup, setLastBackup] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('last_backup_at');
        return null;
    });

    // Category Sorting State
    const [scenarios, setScenarios] = useState(SCENARIOS);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    // Initialize Persistent Storage Check
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
            navigator.storage.persisted().then(setIsPersistent);
        }
    }, []);

    // Initialize sorted scenarios based on local storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedOrder = localStorage.getItem('category_order');
            if (savedOrder) {
                try {
                    const order: string[] = JSON.parse(savedOrder);
                    const reordered = [...SCENARIOS].sort((a, b) => {
                        const idxA = order.indexOf(a.id);
                        const idxB = order.indexOf(b.id);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return 0;
                    });
                    setScenarios(reordered);
                } catch (e) { console.error(e); }
            }
        }
    }, []);

    // Function to handle category move
    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newScenarios = [...scenarios];
        if (direction === 'up' && index > 0) {
            [newScenarios[index], newScenarios[index - 1]] = [newScenarios[index - 1], newScenarios[index]];
        } else if (direction === 'down' && index < newScenarios.length - 1) {
            [newScenarios[index], newScenarios[index + 1]] = [newScenarios[index + 1], newScenarios[index]];
        }
        setScenarios(newScenarios);
        setHasOrderChanged(true);
        // Auto save to local storage
        localStorage.setItem('category_order', JSON.stringify(newScenarios.map(s => s.id)));
    };

    const resetCategoryOrder = () => {
        if (confirm('確定要重置為預設順序？')) {
            localStorage.removeItem('category_order');
            setScenarios(SCENARIOS);
            setHasOrderChanged(false);
        }
    };



    const handleExport = async () => {
        setIsExporting(true);
        try {
            const cards = await db.userCards.toArray();
            const txs = await db.transactions.toArray();

            const backupData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                data: {
                    userCards: cards,
                    transactions: txs
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `卡利害_備份_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const now = new Date().toLocaleString();
            setLastBackup(now);
            localStorage.setItem('last_backup_at', now);
        } catch (e) {
            alert('匯出失敗');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backup = JSON.parse(event.target?.result as string);

                    if (!backup.data || !backup.data.userCards) {
                        throw new Error('格式錯誤');
                    }

                    if (confirm('匯入將會覆蓋或合併現有資料，確定繼續？')) {
                        // Using bulkPut to avoid primary key conflicts (overwrites if ID exists)
                        await db.userCards.bulkPut(backup.data.userCards);
                        await db.transactions.bulkPut(backup.data.transactions || []);
                        alert('匯入成功！');
                    }
                } catch (err) {
                    alert('讀取檔案失敗，請確保這是正確的備份檔');
                }
            };
            reader.readAsText(file);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleClearAll = async () => {
        if (confirm('⚠️ 警告：這將會清除「所有」卡片與消費紀錄！此動作無法復原。確定要繼續嗎？')) {
            await db.userCards.clear();
            await db.transactions.clear();
            alert('資料已清空');
            window.location.reload();
        }
    };

    if (!userCards) return null;

    return (
        <div className="bg-gray-50 min-h-screen pb-24 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">設定</h1>

            {/* Data Management Section */}
            <section className="mb-8 overflow-hidden">
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    資料備份與安全
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs text-gray-500">儲存保護狀態</div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPersistent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {isPersistent ? '🛡️ 已永久授權' : '⚠️ 系統管理中'}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        您的資料目前儲存於此裝置。{isPersistent ? 'iOS 已授權永久儲存，不會隨意清空。' : '建議定期備份以免 Safari 清除資料。'}
                    </p>

                    {lastBackup && (
                        <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                            <span className="text-[10px] text-blue-600 font-bold">上次備份時間</span>
                            <span className="text-[10px] text-blue-500">{lastBackup}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
                        >
                            <Download size={18} />
                            匯出備份
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
                        >
                            <Upload size={18} />
                            匯入備份
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                        accept=".json"
                    />

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleClearAll}
                            className="flex items-center justify-center gap-2 w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <Trash2 size={16} />
                            清除所有資料
                        </button>
                    </div>
                </div>
            </section>

            {/* Category Sorting Section */}
            <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <List size={16} />
                        消費類別排序 (即時儲存)
                    </div>
                    {hasOrderChanged && (
                        <button onClick={resetCategoryOrder} className="text-[10px] text-blue-500 underline">
                            重置預設
                        </button>
                    )}
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {scenarios.map((s, idx) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveCategory(idx, 'up')}
                                        disabled={idx === 0}
                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-20 transition-colors"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => moveCategory(idx, 'down')}
                                        disabled={idx === scenarios.length - 1}
                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-20 transition-colors"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>


        </div>
    );
}
