'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RxDocument } from 'rxdb';
import { getDatabase } from './index';
import { Referral, ReferralWithMeta, Status, StatusChangeNote, User } from './schema';

export function useReferrals() {
  const [referrals, setReferrals] = useState<ReferralWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    async function init() {
      const db = await getDatabase();
      subscription = db.referrals.find().$.subscribe((docs: RxDocument<Referral>[]) => {
        const now = Date.now();
        setReferrals(docs.map((doc: RxDocument<Referral>) => {
          const referral = doc.toJSON() as Referral;
          const createdDate = new Date(referral.createdAt);
          const daysSinceCreated = Math.floor(
            (now - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            ...referral,
            daysSinceCreated,
            isOverdue: referral.status === 'pending' && daysSinceCreated >= 14,
          };
        }));
        setLoading(false);
      });
    }

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const addReferral = async (data: Omit<Referral, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.referrals.insert({
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      isSynced: false,
    });
  };

  const updateReferral = async (id: string, updates: Partial<Referral>) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      });
    }
  };

  const updateStatus = async (id: string, status: Status, note?: string) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      const currentReferral = doc.toJSON() as Referral;
      const updates: Partial<Referral> = { status };

      if (note) {
        const createdDate = new Date(currentReferral.createdAt);
        const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const wasOverdue = currentReferral.status === 'pending' && daysSinceCreated >= 14;

        const statusChangeNote: StatusChangeNote = {
          fromStatus: currentReferral.status,
          toStatus: status,
          note,
          changedAt: new Date().toISOString(),
          wasOverdue,
        };

        const existingNotes = currentReferral.statusChangeNotes || [];
        updates.statusChangeNotes = [...existingNotes, statusChangeNote];
      }

      await updateReferral(id, updates);
    }
  };

  const submitRequest = async (id: string, requestType: 'reschedule' | 'cancel', requestedDate?: string, reason?: string) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      await doc.patch({
        pendingRequest: {
          type: requestType,
          requestedDate,
          reason,
          requestedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
        isSynced: false,
      });
    }
  };

  const clearRequest = async (id: string) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      await doc.patch({
        pendingRequest: undefined,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      });
    }
  };

  const approveRequest = async (id: string) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      const referral = doc.toJSON() as Referral;
      const request = referral.pendingRequest;

      if (!request) return;

      const updates: Partial<Referral> = {
        pendingRequest: undefined,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      };

      if (request.type === 'reschedule' && request.requestedDate) {
        updates.appointmentDate = request.requestedDate;
      } else if (request.type === 'cancel') {
        updates.status = 'cancelled';
      }

      await doc.patch(updates);
    }
  };

  const syncAll = async () => {
    const db = await getDatabase();
    const unsyncedDocs = await db.referrals.find({ selector: { isSynced: false } }).exec();
    for (const doc of unsyncedDocs) {
      await doc.patch({ isSynced: true });
    }
  };

  return { referrals, loading, addReferral, updateReferral, updateStatus, syncAll, submitRequest, clearRequest, approveRequest };
}

export function useUser(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const db = await getDatabase();
        const doc = await db.users.findOne(userId).exec();
        if (doc) {
          setUser(doc.toJSON() as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  return { user, loading };
}
