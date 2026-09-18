import { db } from '../db';
import type { SessionRecord } from '../../shared/types';

/**
 * Database queries module for Storm Launcher.
 * 
 * Equivalent SQL schema:
 * SELECT * FROM sessions WHERE gameId = ? ORDER BY startTime DESC LIMIT ?
 */
export const sessionQueries = {
  getSessionsByGame: (gameId: string, limit: number = 20): SessionRecord[] => {
    return db.getSessionsByGame(gameId, limit);
  }
};
