'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RxDocument } from 'rxdb';
import Fuse from 'fuse.js';
import { getDatabase } from './index';
import { Patient } from './schema';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fuse, setFuse] = useState<Fuse<Patient> | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    async function init() {
      const db = await getDatabase();
      subscription = db.patients.find().$.subscribe((docs: RxDocument<Patient>[]) => {
        const patientList = docs.map((doc) => doc.toJSON() as Patient);
        setPatients(patientList);
        setFuse(
          new Fuse(patientList, {
            keys: ['name', 'email'],
            threshold: 0.4,
            includeScore: true,
          })
        );
        setLoading(false);
      });
    }

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const addPatient = useCallback(
    async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
      const db = await getDatabase();
      const now = new Date().toISOString();
      const newPatient: Patient = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      await db.patients.insert(newPatient);
      return newPatient;
    },
    []
  );

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    const db = await getDatabase();
    const doc = await db.patients.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  const getPatientById = useCallback(
    (id: string): Patient | undefined => {
      return patients.find((p) => p.id === id);
    },
    [patients]
  );

  const getPatientByEmail = useCallback(
    (email: string): Patient | undefined => {
      return patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
    },
    [patients]
  );

  const searchPatients = useCallback(
    (query: string): Array<{ item: Patient; score: number }> => {
      if (!fuse || !query.trim()) return [];
      const results = fuse.search(query);
      return results.map((r) => ({ item: r.item, score: r.score ?? 1 }));
    },
    [fuse]
  );

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    getPatientById,
    getPatientByEmail,
    searchPatients,
  };
}
