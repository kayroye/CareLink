import { createRxDatabase, RxDatabase, RxCollection, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin } from 'rxdb/plugins/core';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import {
  Referral,
  referralSchema,
  User,
  userSchema,
  MagicLinkToken,
  magicLinkTokenSchema,
  Patient,
  patientSchema,
} from './schema';

type ReferralCollection = RxCollection<Referral>;
type UserCollection = RxCollection<User>;
type MagicLinkTokenCollection = RxCollection<MagicLinkToken>;
type PatientCollection = RxCollection<Patient>;

interface DatabaseCollections {
  referrals: ReferralCollection;
  users: UserCollection;
  magicLinkTokens: MagicLinkTokenCollection;
  patients: PatientCollection;
}

type CareLinkDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<CareLinkDatabase> | null = null;
let devModePluginPromise: Promise<void> | null = null;

// Add migration plugin
addRxPlugin(RxDBMigrationSchemaPlugin);

const DB_NAME = 'carelink';

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
    ignoreDuplicate: isDev, // Allow hot reload in development
  });

  await db.addCollections({
    referrals: {
      schema: referralSchema,
      migrationStrategies: {
        // v0 -> v1: Add patientSummary and createdByNurseId
        1: (oldDoc: Record<string, unknown>) => ({
          ...oldDoc,
          patientSummary: oldDoc.patientSummary || 'Please contact your care coordinator for details.',
          createdByNurseId: oldDoc.createdByNurseId || 'demo-nurse-sarah',
        }),
      },
    },
    users: {
      schema: userSchema,
      migrationStrategies: {
        // v0 -> v1: Add phone field
        1: (oldDoc: Record<string, unknown>) => ({
          ...oldDoc,
          phone: oldDoc.phone || undefined,
        }),
      },
    },
    magicLinkTokens: {
      schema: magicLinkTokenSchema,
    },
    patients: {
      schema: patientSchema,
    },
  });

  return db;
}

export async function getDatabase(): Promise<CareLinkDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = initDatabase().catch(async (error) => {
    // Check if this is a schema mismatch error (DB6) or migration error (COL12)
    const isSchemaError = error?.code === 'DB6' || error?.message?.includes('DB6') ||
                          error?.code === 'COL12' || error?.message?.includes('COL12');
    if (isSchemaError) {
      console.warn('Schema/migration error detected. Resetting database for demo...');

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

export type { CareLinkDatabase, ReferralCollection, UserCollection, MagicLinkTokenCollection, PatientCollection };
