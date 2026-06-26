import { randomBytes } from 'crypto';
import { db } from '../db/client';
import { interviews } from '../db/schema';
import { sql } from 'drizzle-orm';

export const tokenService = {
    generateToken(): string {
        // 32-byte cryptographically random token
        return randomBytes(32).toString('hex');
    },

    async createInterviewRecord(candidateId: string, jobId: string) {
        const token = this.generateToken();
        const id = randomBytes(16).toString('hex');
        
        await db.insert(interviews).values({
            id,
            candidateId,
            token,
            status: 'not_invited',
            expiresAt: sql`now() + interval '7 days'`,
        });

        return { id, token };
    }
};
