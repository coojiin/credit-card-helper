export interface RewardPart {
    rate: number; // e.g., 3.0
    capGroupId?: string; // If present, this part consumes from a shared cap
    note?: string; // e.g. "需登錄"
}

export interface RewardRule {
    category: string;
    period: "monthly" | "statement_cycle"; // Defines the reset cycle for the caps used in this rule
    rewardParts: RewardPart[];
}

export interface CapDefinition {
    id: string; // e.g., "j_travel_bonus"
    maxReward: number; // e.g., 1000
    period?: "monthly" | "statement_cycle"; // Override rule period if needed? Usually rule defines period. Let's keep it simple: Cap is reset based on Rule's period? No, Cap has its own cycle usually.
    // Simplifying: Assume Cap Cycle matches Rule Cycle for now.
}

export interface CardScheme {
    id: string;
    name: string;
    rules: RewardRule[];
}

export interface CardDefinition {
    id: string;
    name: string;
    bank: string;
    imageUrl: string;
    defaultBillingCycleDay: number;
    rules: RewardRule[];
    subSchemes?: CardScheme[];
    capDefinitions?: CapDefinition[]; // Definitions of shared caps
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

    // Detailed Cap Info
    capInfo?: {
        capGroupId: string;
        remaining: number;
        total: number;
    }[];

    warningMessage?: string;
    schemeName?: string;

    // Breakdown for UI
    rateBreakdown?: {
        rate: number;
        note?: string;
        isCapped?: boolean;
    }[];
}
