import { createRxDatabase, RxDatabase, RxCollection, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin } from 'rxdb/plugins/core';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import {
  Referral,
  referralSchema,
  User,
  userSchema,
  MagicLinkToken,
  magicLinkTokenSchema
} from './schema';

type ReferralCollection = RxCollection<Referral>;
type UserCollection = RxCollection<User>;
type MagicLinkTokenCollection = RxCollection<MagicLinkToken>;

interface DatabaseCollections {
  referrals: ReferralCollection;
  users: UserCollection;
  magicLinkTokens: MagicLinkTokenCollection;
}

type CareLinkDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<CareLinkDatabase> | null = null;
let devModePluginPromise: Promise<void> | null = null;

const DB_NAME = 'CareLink';

async function initDatabase(): Promise<CareLinkDatabase> {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    if (!devModePluginPromise) {
      devModePluginPromise = import('rxdb/plugins/dev-mode').then(({ RxDBDevModePlugin }) => {
        addRxPlugin(RxDBDevModePlugin);
      });
    }

    await devModePluginPromise;
  }

  const storage = isDev
    ? wrappedValidateAjvStorage({ storage: getRxStorageDexie() })
    : getRxStorageDexie();

  const db = await createRxDatabase<DatabaseCollections>({
    name: DB_NAME,
    storage,
  });

  await db.addCollections({
    referrals: {
      schema: referralSchema,
    },
    users: {
      schema: userSchema,
    },
    magicLinkTokens: {
      schema: magicLinkTokenSchema,
    },
  });

  return db;
}

export async function getDatabase(): Promise<CareLinkDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = initDatabase().catch(async (error) => {
    // Check if this is a schema mismatch error (DB6)
    if (error?.code === 'DB6' || error?.message?.includes('DB6')) {
      console.warn('Schema mismatch detected. Resetting database for demo...');

      // Remove the old database
      try {
        await removeRxDatabase(DB_NAME, getRxStorageDexie());
        console.log('Old database removed successfully.');
      } catch (removeError) {
        console.error('Failed to remove old database:', removeError);
        // Try to delete via IndexedDB directly as fallback
        if (typeof indexedDB !== 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
              console.warn('Database deletion blocked. Please close other tabs.');
              resolve();
            };
          });
        }
      }

      // Reset the promise and try again
      dbPromise = null;
      return initDatabase();
    }

    // Re-throw other errors
    throw error;
  });

  return dbPromise;
}

export type { CareLinkDatabase, ReferralCollection, UserCollection, MagicLinkTokenCollection };
