export interface RewardRule {
    category: string; // e.g., "general", "convenience_store", "gas", "online", "travel_japan"
    percentage: number; // e.g., 3.0 for 3%
    capType: "none" | "amount" | "points";
    capValue?: number; // Cap value
    period: "monthly" | "statement_cycle";
}

export interface CardDefinition {
    id: string;
    name: string;
    bank: string;
    imageUrl: string;
    defaultBillingCycleDay: number;
    rules: RewardRule[];
}

export interface UserCard {
    id: string; // UUID
    cardDefId: string;
    billingCycleDay: number;
    isEnabled: boolean;
}

export interface Transaction {
    id: string; // UUID
    userCardId: string;
    timestamp: number; // Unix timestamp
    amount: number;
    scenario: string;
    earnedReward: number;
    note?: string;
}

export interface RecommendationResult {
    userCard: UserCard;
    cardDef: CardDefinition;
    effectiveRate: number;
    estimatedReward: number;
    remainingCap: number;
    warningMessage?: string;
}
