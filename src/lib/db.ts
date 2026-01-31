import Dexie, { type Table } from 'dexie';
import { UserCard, Transaction } from '@/types';

class CreditCardDB extends Dexie {
    userCards!: Table<UserCard>;
    transactions!: Table<Transaction>;

    constructor() {
        super('CreditCardHelperDB');
        this.version(1).stores({
            userCards: 'id, cardDefId',
            transactions: 'id, userCardId, timestamp, scenario'
        });
    }
}

export const db = new CreditCardDB();
