import { db } from './db';
import { UserCard, CardDefinition, RewardRule, RecommendationResult } from '@/types';
import cardDefinitions from '@/data/cards.json';

export const CARD_DEFS = cardDefinitions as CardDefinition[];

export function getCardDefinition(id: string): CardDefinition | undefined {
    return CARD_DEFS.find(c => c.id === id);
}

// Helper to determine billing cycle range
export function getCycleRange(billingDay: number, period: RewardRule["period"], targetDate: Date = new Date()) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed

    if (period === 'monthly') {
        // Calendar Month: 1st to last day
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59);
        return { start, end };
    } else {
        // Statement Cycle
        // Example: Billing Day = 5. Date = 10/4. Cycle = 9/6 ~ 10/5.
        // Date = 10/6. Cycle = 10/6 ~ 11/5.
        let startMonth = month;
        if (targetDate.getDate() < billingDay) {
            startMonth = month - 1;
        }
        const start = new Date(year, startMonth, billingDay); // e.g. 9/5 ?? Actually Cycle starts usually day after billing day or on billing day depending on bank. 
        // Simplified: Cycle starts on Billing Day. Ends on Next Billing Day - 1s.

        // Adjust logic: Billing Date is usually the "Closing Date". 
        // Cycle is (Previous Closing Date + 1) to (Closing Date).
        // Let's assume billingDay IS the Closing Date.

        let closingDate = new Date(year, month, billingDay, 23, 59, 59);
        if (targetDate.getDate() > billingDay) {
            // We are past this month's closing. Target is next month's closing.
            closingDate = new Date(year, month + 1, billingDay, 23, 59, 59);
        }

        // Cycle Start is Closing Date - 1 month + 1 microsecond (effectively)
        const prevClosing = new Date(closingDate);
        prevClosing.setMonth(prevClosing.getMonth() - 1);
        // Cycle Start = prevClosing + 1 day (or simply just after prevClosing)
        const startCycle = new Date(prevClosing);
        startCycle.setDate(startCycle.getDate() + 1);
        startCycle.setHours(0, 0, 0, 0);

        return { start: startCycle, end: closingDate };
    }
}

export async function calculateRecommendation(
    userCard: UserCard,
    scenario: string,
    amount: number
): Promise<RecommendationResult> {
    const cardDef = getCardDefinition(userCard.cardDefId);
    if (!cardDef) throw new Error("Card Def not found");

    // 1. Find best rule for scenario
    let bestRule = cardDef.rules.find(r => r.category === scenario);
    if (!bestRule) {
        bestRule = cardDef.rules.find(r => r.category === 'general');
    }

    if (!bestRule) {
        // Fallback if absolutely no rule
        return {
            userCard, cardDef, effectiveRate: 0, estimatedReward: 0, remainingCap: Infinity
        };
    }

    // 2. Check Cap
    let remainingCap = Infinity;
    let estimatedReward = amount * (bestRule.percentage / 100);

    if (bestRule.capType !== 'none' && bestRule.capValue) {
        const { start, end } = getCycleRange(userCard.billingCycleDay, bestRule.period);

        const txs = await db.transactions
            .where('userCardId').equals(userCard.id)
            .filter(tx => tx.timestamp >= start.getTime() && tx.timestamp <= end.getTime())
            .toArray();

        // Filter txs that matched this rule?? Or all txs? 
        // Simplified: Assume cap is per "category" rule if specified. 
        // Ideally we need to know which rule created the reward. 
        // For V1, we just sum up ALL rewards for this card if it's a generic cap, OR filter by scenario.
        // But we stored "scenario". 
        // Let's assume the cap applies to THIS specific rule category usage.

        // Re-calculate usage based on historical transactions?
        // Or just sum 'earnedReward'.
        // If the card shares a cap across categories, this logic needs to be complex.
        // V1: Assume cap is isolated to this rule.

        // Problem: We need to know which transactions used THIS rule.
        // We'll filter transactions by scenario if rule is specific.
        const ruleTxs = bestRule.category === 'general'
            ? txs // General rule usually catches everything else, but here we simplify
            : txs.filter(t => t.scenario === scenario);

        const usedAmount = ruleTxs.reduce((sum, t) => sum + t.earnedReward, 0);
        remainingCap = bestRule.capValue - usedAmount;
    }

    // 3. Adjust Reward
    let effectiveReward = estimatedReward;
    let warning = undefined;

    if (remainingCap <= 0) {
        effectiveReward = 0; // Or fallback to base rate? V1: 0
        warning = "已達回饋上限";
    } else if (effectiveReward > remainingCap) {
        effectiveReward = remainingCap;
        warning = "即將達上限";
    }

    return {
        userCard,
        cardDef,
        effectiveRate: (effectiveReward / amount) * 100,
        estimatedReward: effectiveReward,
        remainingCap,
        warningMessage: warning
    };
}
