import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const BASE_PATH = '/credit-card-helper';

export function getAssetPath(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${BASE_PATH}${path}`;
    return `${BASE_PATH}/${path}`;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Map Bank Names to Colors for fallback UI
export function getBankColor(bankName: string) {
    if (bankName.includes('富邦')) return 'bg-blue-600';
    if (bankName.includes('國泰')) return 'bg-green-600';
    if (bankName.includes('台新')) return 'bg-red-600';
    if (bankName.includes('中信') || bankName.includes('中國信託')) return 'bg-teal-600';
    if (bankName.includes('玉山')) return 'bg-emerald-600';
    if (bankName.includes('永豐')) return 'bg-yellow-600';
    if (bankName.includes('聯邦')) return 'bg-indigo-600';
    if (bankName.includes('華南')) return 'bg-orange-600';
    if (bankName.includes('元大')) return 'bg-orange-500';
    return 'bg-gray-600';
}
