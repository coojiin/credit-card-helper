'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CARD_DEFS } from '@/lib/calculator';
import { useState, useRef } from 'react';
import { getBankColor } from '@/lib/utils';
import { Calendar, Download, Upload, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const userCards = useLiveQuery(() => db.userCards.toArray());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const updateBillingDay = async (id: string, day: number) => {
        if (day < 1 || day > 31) return;
        await db.userCards.update(id, { billingCycleDay: day });
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
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        您的資料目前僅儲存於此裝置的本地瀏覽器中。為避免更換手機或清除瀏覽紀錄導致遺失，建議定期匯出備份至身分雲端 (iCloud / Google Drive)。
                    </p>

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

            {/* Billing Day Settings */}
            <section>
                <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
                    <Calendar size={16} />
                    卡片結帳日
                </h2>
                <div className="space-y-3">
                    {userCards.length === 0 && (
                        <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                            <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                            <div className="text-sm text-gray-500">
                                尚未新增任何卡片
                            </div>
                        </div>
                    )}

                    {userCards.map(uc => {
                        const def = CARD_DEFS.find(c => c.id === uc.cardDefId);
                        if (!def) return null;
                        const bankColor = getBankColor(def.bank);

                        return (
                            <div key={uc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-6 rounded shadow-sm ${bankColor}`} />
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{def.name}</div>
                                        <div className="text-[10px] text-gray-400">
                                            結帳日: 每月 {uc.billingCycleDay} 號
                                        </div>
                                    </div>
                                </div>

                                <select
                                    value={uc.billingCycleDay}
                                    onChange={(e) => updateBillingDay(uc.id, parseInt(e.target.value))}
                                    className="bg-gray-50 border-none rounded-lg py-2 px-3 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                        <option key={d} value={d}>{d} 號結帳</option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
