import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { RxCollection } from 'rxdb';
import { CareLinkDatabase } from './index';

// Get the proxy URL - uses same origin as the app, works on localhost and LAN
function getProxyUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/couchdb`;
  }
  return '/api/couchdb';
}

interface SyncState {
  patients: ReturnType<typeof replicateCouchDB> | null;
  referrals: ReturnType<typeof replicateCouchDB> | null;
}

const syncState: SyncState = {
  patients: null,
  referrals: null,
};

export async function startSync(db: CareLinkDatabase, userRole: 'nurse' | 'patient') {
  // Stop any existing sync
  await stopSync();

  const isNurse = userRole === 'nurse';
  const proxyUrl = getProxyUrl();

  console.log('[CouchDB Sync] Starting sync for role:', userRole);
  console.log('[CouchDB Sync] Proxy URL:', proxyUrl);

  // Sync patients collection (auth handled by proxy)
  syncState.patients = replicateCouchDB({
    replicationIdentifier: 'carelink-patients-sync',
    collection: db.patients as unknown as RxCollection,
    url: `${proxyUrl}/carelink_patients/`,
    live: true,
    pull: {
      batchSize: 100,
    },
    push: isNurse
      ? {
          batchSize: 100,
        }
      : undefined, // Patients can only pull
  });

  // Sync referrals collection (auth handled by proxy)
  syncState.referrals = replicateCouchDB({
    replicationIdentifier: 'carelink-referrals-sync',
    collection: db.referrals as unknown as RxCollection,
    url: `${proxyUrl}/carelink_referrals/`,
    live: true,
    pull: {
      batchSize: 100,
    },
    push: isNurse
      ? {
          batchSize: 100,
        }
      : undefined, // Patients can only pull
  });

  // Handle errors
  syncState.patients.error$.subscribe((err) => {
    console.error('Patients sync error:', err);
  });

  syncState.referrals.error$.subscribe((err) => {
    console.error('Referrals sync error:', err);
  });

  return syncState;
}

export async function stopSync() {
  if (syncState.patients) {
    await syncState.patients.cancel();
    syncState.patients = null;
  }
  if (syncState.referrals) {
    await syncState.referrals.cancel();
    syncState.referrals = null;
  }
}

export function getSyncState() {
  return syncState;
}
